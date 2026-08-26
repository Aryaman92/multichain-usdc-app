"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { erc20Abi, USDC_ADDRESSES, USDC_DECIMALS } from "@/lib/erc20";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function SendUsdc() {
  const { address, chainId, isConnected } = useAccount();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedPending, setSavedPending] = useState(false);

  const usdcAddress = chainId ? USDC_ADDRESSES[chainId] : undefined;

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

  async function saveTransaction(status: "pending" | "success" | "failed") {
    if (!hash || !address || !chainId || !recipient || !amount) return;

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

    if (!usdcAddress) {
      setError("USDC is not configured on this network.");
      return;
    }

    if (!recipient.startsWith("0x") || recipient.length !== 42) {
      setError("Enter a valid recipient address.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }

    writeContract({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: [
        recipient as `0x${string}`,
        parseUnits(amount, USDC_DECIMALS),
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
          on current network
        </span>
      </div>

      <div className="border border-border rounded-lg bg-panel p-5 space-y-4">
        <div>
          <label className="block text-xs font-mono text-muted uppercase tracking-wide mb-2">
            Recipient
          </label>

          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
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
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              type="number"
              min="0"
              step="0.01"
              className="flex-1 bg-panel2 border border-border rounded-l-md px-3 py-2 text-sm font-mono text-ivory outline-none focus:border-brass"
            />

            <div className="border border-l-0 border-border rounded-r-md px-3 py-2 text-sm font-mono text-muted bg-panel2">
              USDC
            </div>
          </div>
        </div>

        <button
          onClick={send}
          disabled={isPending || isConfirming}
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
            {error ?? writeError?.message}
          </p>
        )}

        {hash && (
          <div className="text-xs font-mono text-muted break-all">
            Tx: {hash}
          </div>
        )}

        {isSuccess && (
          <p className="text-sm text-mint">
            Transaction confirmed.
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