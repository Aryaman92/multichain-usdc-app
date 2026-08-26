"use client";

import { useEffect, useState } from "react";
import { useAccount, useWatchContractEvent } from "wagmi";
import { erc20Abi, USDC_ADDRESSES, USDC_DECIMALS } from "@/lib/erc20";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type TransferEntry = {
  type: "transfer";
  id: string;
  direction: "in" | "out";
  amount: string;
  counterparty: string;
  txHash: string;
  status?: "pending" | "success" | "failed";
  symbol?: string;
  verifiedOnChain?: boolean;
};

type BridgeEntry = {
  type: "bridge";
  id: string;
  amount: string;
  token: string;
  sourceChain: string;
  destinationChain: string;
  status: "pending" | "success" | "failed";
  sourceTxHash?: string | null;
  destinationTxHash?: string | null;
  reconciled?: boolean;
};

type Entry = TransferEntry | BridgeEntry;

export function LedgerFeed() {
  const { address, chainId, isConnected } = useAccount();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const usdcAddress = chainId ? USDC_ADDRESSES[chainId] : undefined;

  async function loadHistory() {
    if (!address || !chainId) return;

    setLoading(true);

    try {
      const [transactionsResponse, bridgesResponse] = await Promise.all([
        fetch(`${API_URL}/api/transactions/${address}`),
        fetch(`${API_URL}/api/bridges/${address}`),
      ]);

      const transactionsData = await transactionsResponse.json();
      const bridgesData = await bridgesResponse.json();

      const transfers: TransferEntry[] = (
        transactionsData.transactions ?? []
      )
        .filter((tx: any) => tx.chainId === chainId)
        .map((tx: any) => {
          const incoming =
            tx.recipient.toLowerCase() === address.toLowerCase();

          return {
            type: "transfer",
            id: tx.hash,
            direction: incoming ? "in" : "out",
            amount: tx.amount,
            counterparty: incoming ? tx.sender : tx.recipient,
            txHash: tx.hash,
            status: tx.status,
            symbol: tx.symbol ?? "USDC",
            verifiedOnChain: tx.verifiedOnChain ?? false,
          };
        });

      const bridges: BridgeEntry[] = (bridgesData.bridges ?? [])
        .filter(
          (bridge: any) =>
            bridge.sourceChainId === chainId ||
            bridge.destinationChainId === chainId
        )
        .map((bridge: any) => ({
          type: "bridge",
          id: bridge._id,
          amount: bridge.amount,
          token: bridge.token ?? "USDC",
          sourceChain: bridge.sourceChain,
          destinationChain: bridge.destinationChain,
          status: bridge.status,
          sourceTxHash: bridge.sourceTxHash,
          destinationTxHash: bridge.destinationTxHash,
          reconciled: bridge.reconciled ?? false,
        }));

      setEntries([...bridges, ...transfers]);
    } catch (err) {
      console.error("Could not load activity:", err);
    } finally {
      setLoading(false);
    }
  }

  async function verifyTransaction(entry: TransferEntry) {
    if (!chainId) return;

    setVerifying(entry.txHash);

    try {
      await fetch(
        `${API_URL}/api/transactions/verify/${chainId}/${entry.txHash}`
      );

      await loadHistory();
    } finally {
      setVerifying(null);
    }
  }

  useEffect(() => {
    loadHistory().catch(() => {});
  }, [address, chainId]);

  useWatchContractEvent({
    address: usdcAddress,
    abi: erc20Abi,
    eventName: "Transfer",
    enabled: Boolean(usdcAddress && address),

    onLogs(logs) {
      const relevant = logs.filter(
        (log) =>
          log.args.from?.toLowerCase() === address?.toLowerCase() ||
          log.args.to?.toLowerCase() === address?.toLowerCase()
      );

      if (relevant.length) {
        loadHistory().catch(() => {});
      }
    },
  });

  if (!isConnected) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="font-display font-medium text-ivory">
            Activity
          </h2>

          <p className="text-xs text-muted mt-1">
            Transfers and bridge activity linked to your wallet.
          </p>
        </div>

        <button
          onClick={() => loadHistory()}
          disabled={loading}
          className="text-xs font-mono text-brass uppercase tracking-wide disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="border border-border rounded-xl bg-ledger-lines overflow-hidden shadow-glow">
        {entries.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-muted text-sm">
              No asset activity recorded yet.
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto ledger-scroll divide-y divide-border">
            {entries.map((entry) => {
              if (entry.type === "bridge") {
                return (
                  <div key={entry.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs px-2 py-1 rounded bg-violet/10 text-violet">
                          BRIDGE
                        </span>

                        <div>
                          <p className="text-sm text-ivory">
                            {entry.sourceChain}
                            <span className="text-muted mx-2">→</span>
                            {entry.destinationChain}
                          </p>

                          <p className="text-xs font-mono text-muted mt-1">
                            CCTP transfer
                          </p>
                        </div>
                      </div>

                      <span className="font-mono text-ivory">
                        {entry.amount} {entry.token}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span
                          className={
                            entry.status === "success"
                              ? "text-mint"
                              : entry.status === "failed"
                              ? "text-coral"
                              : "text-brass"
                          }
                        >
                          {entry.status}
                        </span>

                        {entry.reconciled && (
                          <span className="text-mint">
                            ✓ Reconciled
                          </span>
                        )}
                      </div>

                      {entry.sourceTxHash && (
                        <span className="text-xs font-mono text-muted">
                          {entry.sourceTxHash.slice(0, 10)}…
                          {entry.sourceTxHash.slice(-6)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={entry.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono text-xs px-2 py-1 rounded ${
                          entry.direction === "in"
                            ? "bg-mint/10 text-mint"
                            : "bg-coral/10 text-coral"
                        }`}
                      >
                        {entry.direction === "in" ? "IN" : "OUT"}
                      </span>

                      <span className="font-mono text-muted text-xs">
                        {entry.counterparty.slice(0, 6)}…
                        {entry.counterparty.slice(-4)}
                      </span>
                    </div>

                    <span className="font-mono text-ivory">
                      {entry.direction === "in" ? "+" : "−"}
                      {entry.amount} {entry.symbol}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span
                        className={
                          entry.status === "success"
                            ? "text-mint"
                            : entry.status === "failed"
                            ? "text-coral"
                            : "text-brass"
                        }
                      >
                        {entry.status ?? "success"}
                      </span>

                      {entry.verifiedOnChain ? (
                        <span className="text-mint">
                          ✓ Verified on-chain
                        </span>
                      ) : (
                        <button
                          onClick={() => verifyTransaction(entry)}
                          disabled={verifying === entry.txHash}
                          className="text-brass disabled:opacity-50"
                        >
                          {verifying === entry.txHash
                            ? "Verifying..."
                            : "Verify on-chain"}
                        </button>
                      )}
                    </div>

                    <span className="text-xs font-mono text-muted">
                      {entry.txHash.slice(0, 10)}…
                      {entry.txHash.slice(-6)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}