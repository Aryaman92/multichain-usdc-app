import { Router } from "express";
import {
  createPublicClient,
  http,
  parseEventLogs,
  parseUnits,
} from "viem";

import { Transaction } from "../models/Transaction.js";

const router = Router();

const RPC_URLS = {
  11155111: "https://ethereum-sepolia-rpc.publicnode.com",
  84532: "https://base-sepolia-rpc.publicnode.com",
  43113: "https://api.avax-test.network/ext/bc/C/rpc",
  5042002: "https://rpc.testnet.arc.network",
};

const transferAbi = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
    ],
  },
];

router.post("/", async (req, res) => {
  try {
    const {
      hash,
      sender,
      recipient,
      amount,
      chainId,
      status = "pending",
      symbol = "USDC",
    } = req.body;

    if (!hash || !sender || !recipient || !amount || !chainId) {
      return res.status(400).json({
        error: "Missing transaction fields.",
      });
    }

    const transaction = await Transaction.findOneAndUpdate(
      {
        hash: hash.toLowerCase(),
      },
      {
        hash: hash.toLowerCase(),
        sender: sender.toLowerCase(),
        recipient: recipient.toLowerCase(),
        amount,
        chainId,
        symbol,
        status,
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.json({ transaction });
  } catch (err) {
    console.error("Transaction save failed:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

router.get("/verify/:chainId/:hash", async (req, res) => {
  try {
    const chainId = Number(req.params.chainId);
    const hash = req.params.hash.toLowerCase();

    const rpcUrl = RPC_URLS[chainId];

    if (!rpcUrl) {
      return res.status(400).json({
        error: "Unsupported network.",
      });
    }

    const record = await Transaction.findOne({
      hash,
      chainId,
    });

    if (!record) {
      return res.status(404).json({
        error: "Transaction not found in database.",
      });
    }

    const client = createPublicClient({
      transport: http(rpcUrl),
    });

    let receipt;

    try {
      receipt = await client.getTransactionReceipt({
        hash,
      });
    } catch {
      return res.json({
        status: "pending",
        verifiedOnChain: false,
        message: "Transaction is not confirmed yet.",
      });
    }

    if (receipt.status === "reverted") {
      record.status = "failed";
      record.verifiedOnChain = true;
      record.blockNumber = receipt.blockNumber.toString();
      record.verifiedAt = new Date();

      await record.save();

      return res.json({
        status: "failed",
        verifiedOnChain: true,
        blockNumber: receipt.blockNumber.toString(),
      });
    }

    const transferLogs = parseEventLogs({
      abi: transferAbi,
      logs: receipt.logs,
      eventName: "Transfer",
      strict: false,
    });

    const expectedAmount = parseUnits(record.amount, 6);

    const matchingTransfer = transferLogs.find((log) => {
      return (
        log.args.from?.toLowerCase() ===
          record.sender.toLowerCase() &&
        log.args.to?.toLowerCase() ===
          record.recipient.toLowerCase() &&
        log.args.value === expectedAmount
      );
    });

    if (!matchingTransfer) {
      record.status = "failed";
      record.verifiedOnChain = false;
      record.blockNumber = receipt.blockNumber.toString();
      record.verifiedAt = new Date();

      await record.save();

      return res.json({
        status: "mismatch",
        verifiedOnChain: false,
        message:
          "Transaction exists on-chain but the expected USDC transfer was not found.",
      });
    }

    record.status = "success";
    record.verifiedOnChain = true;
    record.blockNumber = receipt.blockNumber.toString();
    record.verifiedAt = new Date();

    await record.save();

    res.json({
      status: "success",
      verifiedOnChain: true,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (err) {
    console.error("Verification failed:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

router.get("/:address", async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();

    const transactions = await Transaction.find({
      $or: [
        { sender: address },
        { recipient: address },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ transactions });
  } catch (err) {
    console.error("Transaction fetch failed:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

export default router;