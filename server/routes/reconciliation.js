import { Router } from "express";
import { createPublicClient, http } from "viem";
import { Transaction } from "../models/Transaction.js";
import { Bridge } from "../models/Bridge.js";

const router = Router();

const RPC_URLS = {
  11155111: "https://ethereum-sepolia-rpc.publicnode.com",
  84532: "https://base-sepolia-rpc.publicnode.com",
  43113: "https://api.avax-test.network/ext/bc/C/rpc",
  5042002: "https://rpc.testnet.arc.network",
};

function getClient(chainId) {
  const rpcUrl = RPC_URLS[chainId];

  if (!rpcUrl) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  return createPublicClient({
    transport: http(rpcUrl),
  });
}

async function checkReceipt(chainId, hash) {
  if (!hash) {
    return {
      exists: false,
      status: "missing",
      blockNumber: null,
    };
  }

  try {
    const client = getClient(chainId);

    const receipt = await client.getTransactionReceipt({
      hash,
    });

    return {
      exists: true,
      status:
        receipt.status === "success"
          ? "success"
          : "failed",
      blockNumber: receipt.blockNumber.toString(),
    };
  } catch {
    return {
      exists: false,
      status: "missing",
      blockNumber: null,
    };
  }
}

router.get("/:wallet", async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();

    const transactions = await Transaction.find({
      $or: [
        { sender: wallet },
        { recipient: wallet },
      ],
    }).sort({ createdAt: -1 });

    const bridges = await Bridge.find({
      wallet,
    }).sort({ createdAt: -1 });

    const transactionResults = [];

    for (const tx of transactions) {
      const chainResult = await checkReceipt(
        tx.chainId,
        tx.hash
      );

      let reconciliationStatus = "matched";

      if (!chainResult.exists) {
        reconciliationStatus = "missing";
      } else if (
        tx.status === "success" &&
        chainResult.status !== "success"
      ) {
        reconciliationStatus = "mismatch";
      } else if (
        tx.status === "failed" &&
        chainResult.status !== "failed"
      ) {
        reconciliationStatus = "mismatch";
      } else if (
        tx.status === "pending" &&
        chainResult.status === "success"
      ) {
        reconciliationStatus = "mismatch";
      }

      transactionResults.push({
        type: "transaction",
        id: tx._id,
        hash: tx.hash,
        chainId: tx.chainId,
        databaseStatus: tx.status,
        chainStatus: chainResult.status,
        blockNumber: chainResult.blockNumber,
        reconciliationStatus,
      });
    }

    const bridgeResults = [];

    for (const bridge of bridges) {
      const source = await checkReceipt(
        bridge.sourceChainId,
        bridge.sourceTxHash
      );

      const destination = bridge.destinationTxHash
        ? await checkReceipt(
            bridge.destinationChainId,
            bridge.destinationTxHash
          )
        : {
            exists: false,
            status: "missing",
            blockNumber: null,
          };

      let reconciliationStatus = "matched";

      if (!source.exists) {
        reconciliationStatus = "missing";
      } else if (
        bridge.status === "success" &&
        source.status !== "success"
      ) {
        reconciliationStatus = "mismatch";
      } else if (
        bridge.status === "success" &&
        bridge.destinationTxHash &&
        destination.status !== "success"
      ) {
        reconciliationStatus = "mismatch";
      } else if (
        bridge.status === "pending"
      ) {
        reconciliationStatus = "pending";
      }

      bridge.reconciled =
        reconciliationStatus === "matched";

      await bridge.save();

      bridgeResults.push({
        type: "bridge",
        id: bridge._id,
        amount: bridge.amount,
        token: bridge.token,
        sourceChain: bridge.sourceChain,
        destinationChain: bridge.destinationChain,
        sourceTxHash: bridge.sourceTxHash,
        destinationTxHash: bridge.destinationTxHash,
        databaseStatus: bridge.status,
        sourceChainStatus: source.status,
        destinationChainStatus: destination.status,
        reconciliationStatus,
      });
    }

    const allResults = [
      ...transactionResults,
      ...bridgeResults,
    ];

    const summary = {
      total: allResults.length,
      matched: allResults.filter(
        (item) =>
          item.reconciliationStatus === "matched"
      ).length,
      mismatch: allResults.filter(
        (item) =>
          item.reconciliationStatus === "mismatch"
      ).length,
      missing: allResults.filter(
        (item) =>
          item.reconciliationStatus === "missing"
      ).length,
      pending: allResults.filter(
        (item) =>
          item.reconciliationStatus === "pending"
      ).length,
    };

    res.json({
      summary,
      results: allResults,
    });
  } catch (err) {
    console.error("Reconciliation failed:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

export default router;