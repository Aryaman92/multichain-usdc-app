"use client";

import { useRef, useState } from "react";
import { useAccount } from "wagmi";
import type { EIP1193Provider } from "viem";
import { BridgeKit } from "@circle-fin/bridge-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function safeJson(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_, item) =>
      typeof item === "bigint" ? item.toString() : item
    )
  );
}

function findStepTxHash(
  value: unknown,
  stepName: "burn" | "mint"
): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findStepTxHash(item, stepName);

      if (found) {
        return found;
      }
    }

    return null;
  }

  const obj = value as Record<string, unknown>;

  if (
    obj.name === stepName &&
    typeof obj.txHash === "string" &&
    /^0x[a-fA-F0-9]{64}$/.test(obj.txHash)
  ) {
    return obj.txHash;
  }

  for (const item of Object.values(obj)) {
    const found = findStepTxHash(item, stepName);

    if (found) {
      return found;
    }
  }

  return null;
}

export function BridgeToArc() {
  const { address, chainId, isConnected } = useAccount();

  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isBridging, setIsBridging] = useState(false);

  const bridgeLock = useRef(false);

  async function updateBridgeRecord(
    id: string,
    body: Record<string, unknown>
  ) {
    const response = await fetch(`${API_URL}/api/bridges/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Could not update bridge record.");
    }
  }

  async function bridge() {
    if (bridgeLock.current) return;

    setError("");
    setStatus("");

    if (!isConnected || !address) {
      setError("Connect your wallet first.");
      return;
    }

    if (chainId !== 11155111) {
      setError("Switch to Ethereum Sepolia first.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }

    bridgeLock.current = true;
    setIsBridging(true);

    let bridgeRecordId: string | null = null;

    try {
      setStatus("Creating bridge record...");

      const createResponse = await fetch(`${API_URL}/api/bridges`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: address,
          amount,
          token: "USDC",
          sourceChain: "Ethereum Sepolia",
          sourceChainId: 11155111,
          destinationChain: "Arc Testnet",
          destinationChainId: 5042002,
          status: "pending",
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Could not create bridge record.");
      }

      const createData = await createResponse.json();
      bridgeRecordId = createData.bridge?._id ?? null;

      setStatus("Preparing bridge...");

      if (!window.ethereum) {
        throw new Error("MetaMask is not available.");
      }

      const provider = window.ethereum as EIP1193Provider;

      await provider.request({
        method: "eth_requestAccounts",
      });

      const adapter = await createViemAdapterFromProvider({
        provider,
      });

      const kit = new BridgeKit();

      setStatus("Confirm the bridge transactions in MetaMask...");

      const result = await kit.bridge({
        from: {
          adapter: adapter as any,
          chain: "Ethereum_Sepolia",
        },

        to: {
          chain: "Arc_Testnet",
          recipientAddress: address,
          useForwarder: true,
        },

        amount,

        config: {
          transferSpeed: "FAST",
        },
      });

      const cleanResult = safeJson(result);

      const burnTxHash = findStepTxHash(cleanResult, "burn");
      const mintTxHash = findStepTxHash(cleanResult, "mint");

      console.log("Bridge result:", cleanResult);
      console.log("Burn transaction:", burnTxHash);
      console.log("Mint transaction:", mintTxHash);

      if (bridgeRecordId) {
        await updateBridgeRecord(bridgeRecordId, {
          status:
            result.state === "success" ? "success" : "pending",
          sourceTxHash: burnTxHash,
          destinationTxHash: mintTxHash,
          steps: cleanResult,
        });
      }

      if (result.state === "success") {
        setStatus("Bridge completed ✓");
        setAmount("");
      } else {
        setStatus("Bridge submitted. Waiting for completion...");
      }
    } catch (err: any) {
      console.error("Bridge error:", err);

      if (bridgeRecordId) {
        try {
          await updateBridgeRecord(bridgeRecordId, {
            status: "failed",
          });
        } catch (saveError) {
          console.error(
            "Could not update failed bridge:",
            saveError
          );
        }
      }

      if (
        err?.code === 4001 ||
        err?.message?.toLowerCase().includes("user rejected")
      ) {
        setError("Bridge cancelled in wallet.");
      } else if (
        err?.message?.toLowerCase().includes("too many requests")
      ) {
        setError(
          "Too many wallet requests. Wait a few seconds, then try again."
        );
      } else {
        setError(
          err?.message ||
            "Bridge failed. Check the browser console for details."
        );
      }

      setStatus("");
    } finally {
      setIsBridging(false);
      bridgeLock.current = false;
    }
  }

  if (!isConnected) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="font-display font-medium text-ivory">
            Bridge to Arc
          </h2>

          <p className="text-xs text-muted mt-1">
            Move USDC from Ethereum Sepolia to Arc Testnet.
          </p>
        </div>

        <span className="text-xs font-mono text-brass uppercase tracking-wide">
          CCTP
        </span>
      </div>

      <div className="border border-border rounded-xl bg-panel p-5 space-y-5 shadow-glow">
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-border rounded-lg bg-panel2 p-4">
            <p className="text-xs text-muted font-mono uppercase">
              From
            </p>

            <p className="text-sm text-ivory mt-2">
              Ethereum Sepolia
            </p>
          </div>

          <div className="border border-border rounded-lg bg-panel2 p-4">
            <p className="text-xs text-muted font-mono uppercase">
              To
            </p>

            <p className="text-sm text-ivory mt-2">
              Arc Testnet
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-muted uppercase tracking-wide mb-2">
            Amount
          </label>

          <div className="flex">
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isBridging}
              className="flex-1 bg-panel2 border border-border rounded-l-lg px-3 py-3 text-sm font-mono text-ivory outline-none focus:border-brass disabled:opacity-50"
            />

            <div className="border border-l-0 border-border rounded-r-lg px-4 py-3 text-sm font-mono text-muted bg-panel2">
              USDC
            </div>
          </div>
        </div>

        <button
          onClick={bridge}
          disabled={isBridging}
          className="w-full rounded-lg bg-brass text-ink font-semibold px-4 py-3 disabled:opacity-50 shadow-glow"
        >
          {isBridging ? "Bridge in progress..." : "Bridge to Arc"}
        </button>

        {status && (
          <p className="text-sm text-mint">{status}</p>
        )}

        {error && (
          <p className="text-sm text-coral">{error}</p>
        )}
      </div>
    </div>
  );
}