"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import {
  erc20Abi,
  USDC_ADDRESSES,
  USDC_DECIMALS,
} from "@/lib/erc20";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const CHAIN_NAMES: Record<number, string> = {
  11155111: "Ethereum Sepolia",
  84532: "Base Sepolia",
  43113: "Avalanche Fuji",
  5042002: "Arc Testnet",
};

export function SendUsdc() {
  const { address, chainId, isConnected } = useAccount();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedPending, setSavedPending] = useState(false);

  const usdcAddress = chainId
    ? USDC_ADDRESSES[chainId]
    : undefined;

  const networkName = chainId
    ? CHAIN_NAMES[chainId] ?? `Chain ${chainId}`
    : "Unknown network";

  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: receiptFailed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  async function saveTransaction(
    status: "pending" | "success" | "failed"
  ) {
    if (
      !hash ||
      !address ||
      !chainId ||
      !recipient ||
      !amount
    ) {
      return;
    }

    try {
      await fetch(`${API_URL}/api/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hash,
          sender: address,
          recipient,
          amount,
          chainId,
          status,
        }),
      });
    } catch (err) {
      console.error("Could not save transaction:", err);
    }
  }

  useEffect(() => {
    if (!hash || savedPending) return;

    saveTransaction("pending").catch(() => {});
    setSavedPending(true);
  }, [hash, savedPending]);

  useEffect(() => {
    if (!isSuccess) return;

    saveTransaction("success").catch(() => {});
  }, [isSuccess]);

  useEffect(() => {
    if (!receiptFailed) return;

    saveTransaction("failed").catch(() => {});
  }, [receiptFailed]);

  function send() {
    setError(null);
    setSavedPending(false);

    if (!address || !isConnected) {
      setError("Connect your wallet first.");
      return;
    }

    if (!chainId) {
      setError("No active network detected.");
      return;
    }

    if (!usdcAddress) {
      setError("USDC is not configured on this network.");
      return;
    }

    if (
      !recipient.startsWith("0x") ||
      recipient.length !== 42
    ) {
      setError("Enter a valid recipient address.");
      return;
    }

    if (
      !amount ||
      Number.isNaN(Number(amount)) ||
      Number(amount) <= 0
    ) {
      setError("Enter an amount greater than 0.");
      return;
    }

    let parsedAmount: bigint;

    try {
      parsedAmount = parseUnits(
        amount,
        USDC_DECIMALS
      );
    } catch {
      setError("Enter a valid USDC amount.");
      return;
    }

    writeContract({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: [
        recipient as `0x${string}`,
        parsedAmount,
      ],
    });
  }

  if (!isConnected) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display font-medium text-ivory">
          Send USDC
        </h2>

        <span className="text-xs font-mono text-muted uppercase tracking-wide">
          {networkName}
        </span>
      </div>

      <div className="border border-border rounded-lg bg-panel p-5 space-y-4">
        <div>
          <label className="block text-xs font-mono text-muted uppercase tracking-wide mb-2">
            Recipient
          </label>

          <input
            value={recipient}
            onChange={(e) =>
              setRecipient(e.target.value.trim())
            }
            placeholder="0x..."
            className="w-full bg-panel2 border border-border rounded-md px-3 py-2 text-sm font-mono text-ivory outline-none focus:border-brass"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-muted uppercase tracking-wide mb-2">
            Amount
          </label>

          <div className="flex">
            <input
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              placeholder="0.00"
              type="number"
              min="0"
              step="0.000001"
              className="flex-1 bg-panel2 border border-border rounded-l-md px-3 py-2 text-sm font-mono text-ivory outline-none focus:border-brass"
            />

            <div className="border border-l-0 border-border rounded-r-md px-3 py-2 text-sm font-mono text-muted bg-panel2">
              USDC
            </div>
          </div>
        </div>

        {amount && Number(amount) > 0 && (
          <div className="rounded-lg border border-border bg-panel2 px-4 py-4 space-y-3">
            <div>
              <p className="text-xs font-mono text-muted uppercase tracking-wide">
                Transaction preview
              </p>

              <p className="text-xl font-mono text-ivory mt-1">
                {amount} USDC
              </p>
            </div>

            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between gap-4">
                <span className="text-muted">
                  Network
                </span>

                <span className="text-ivory text-right">
                  {networkName}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted">
                  Token decimals
                </span>

                <span className="text-ivory">
                  {USDC_DECIMALS}
                </span>
              </div>

              {recipient && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Recipient
                  </span>

                  <span className="text-ivory text-right">
                    {recipient.slice(0, 8)}…
                    {recipient.slice(-6)}
                  </span>
                </div>
              )}
            </div>

            {usdcAddress && (
              <div>
                <p className="text-xs font-mono text-muted mb-1">
                  USDC contract
                </p>

                <p className="text-xs font-mono text-ivory break-all">
                  {usdcAddress}
                </p>
              </div>
            )}

            {chainId === 5042002 && (
              <div className="rounded-md border border-brass/30 bg-brass/5 px-3 py-3">
                <p className="text-xs text-brass leading-relaxed">
                  MetaMask may label Arc Testnet
                  USDC as &quot;Unknown&quot; because
                  testnet token metadata may not be
                  recognized. The amount shown here is
                  the actual USDC amount being sent.
                </p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={send}
          disabled={
            isPending ||
            isConfirming ||
            !amount ||
            !recipient
          }
          className="w-full rounded-md bg-brass text-ink font-medium px-4 py-2 disabled:opacity-50"
        >
          {isPending
            ? "Confirm in wallet..."
            : isConfirming
            ? "Waiting for confirmation..."
            : "Send USDC"}
        </button>

        {(error || writeError) && (
          <p className="text-sm text-coral">
            {error ??
              writeError?.message ??
              "Transaction could not be submitted."}
          </p>
        )}

        {hash && (
          <div className="rounded-md bg-panel2 border border-border p-3">
            <p className="text-xs font-mono text-muted mb-1">
              Transaction hash
            </p>

            <p className="text-xs font-mono text-ivory break-all">
              {hash}
            </p>
          </div>
        )}

        {isSuccess && (
          <p className="text-sm text-mint">
            ✓ Transaction confirmed on-chain.
          </p>
        )}

        {receiptFailed && (
          <p className="text-sm text-coral">
            Transaction failed on-chain.
          </p>
        )}
      </div>
    </div>
  );
}