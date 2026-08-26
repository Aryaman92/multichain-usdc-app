"use client";

import { useEffect, useState } from "react";
import { useAccount, useWatchContractEvent } from "wagmi";
import { erc20Abi, USDC_ADDRESSES } from "@/lib/erc20";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const CHAIN_NAMES: Record<number, string> = {
  11155111: "Ethereum Sepolia",
  84532: "Base Sepolia",
  43113: "Avalanche Fuji",
  5042002: "Arc Testnet",
};

type TransferEntry = {
  type: "transfer";
  id: string;
  direction: "in" | "out";
  amount: string;
  counterparty: string;
  txHash: string;
  chainId: number;
  chainName: string;
  status?: "pending" | "success" | "failed";
  symbol?: string;
  verifiedOnChain?: boolean;
  createdAt?: string;
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
  createdAt?: string;
};

type Entry = TransferEntry | BridgeEntry;

export function LedgerFeed() {
  const { address, chainId, isConnected } = useAccount();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const usdcAddress = chainId
    ? USDC_ADDRESSES[chainId]
    : undefined;

  async function loadHistory() {
    if (!address) return;

    setLoading(true);

    try {
      const [transactionsResponse, bridgesResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/transactions/${address}`),
          fetch(`${API_URL}/api/bridges/${address}`),
        ]);

      const transactionsData =
        await transactionsResponse.json();

      const bridgesData =
        await bridgesResponse.json();

      const transfers: TransferEntry[] = (
        transactionsData.transactions ?? []
      ).map((tx: any) => {
        const incoming =
          tx.recipient?.toLowerCase() ===
          address.toLowerCase();

        return {
          type: "transfer",
          id: tx.hash,
          direction: incoming ? "in" : "out",
          amount: tx.amount,
          counterparty: incoming
            ? tx.sender
            : tx.recipient,
          txHash: tx.hash,
          chainId: tx.chainId,
          chainName:
            CHAIN_NAMES[tx.chainId] ??
            `Chain ${tx.chainId}`,
          status: tx.status,
          symbol: tx.symbol ?? "USDC",
          verifiedOnChain:
            tx.verifiedOnChain ?? false,
          createdAt: tx.createdAt,
        };
      });

      const bridges: BridgeEntry[] = (
        bridgesData.bridges ?? []
      ).map((bridge: any) => ({
        type: "bridge",
        id: bridge._id,
        amount: bridge.amount,
        token: bridge.token ?? "USDC",
        sourceChain: bridge.sourceChain,
        destinationChain:
          bridge.destinationChain,
        status: bridge.status,
        sourceTxHash: bridge.sourceTxHash,
        destinationTxHash:
          bridge.destinationTxHash,
        reconciled:
          bridge.reconciled ?? false,
        createdAt: bridge.createdAt,
      }));

      const allEntries: Entry[] = [
        ...bridges,
        ...transfers,
      ].sort((a, b) => {
        const aTime = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

        const bTime = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return bTime - aTime;
      });

      setEntries(allEntries);
    } catch (err) {
      console.error(
        "Could not load transaction history:",
        err
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyTransaction(
    entry: TransferEntry
  ) {
    setVerifying(entry.txHash);

    try {
      await fetch(
        `${API_URL}/api/transactions/verify/${entry.chainId}/${entry.txHash}`
      );

      await loadHistory();
    } finally {
      setVerifying(null);
    }
  }

  useEffect(() => {
    loadHistory().catch(() => {});
  }, [address]);

  useWatchContractEvent({
    address: usdcAddress,
    abi: erc20Abi,
    eventName: "Transfer",
    enabled: Boolean(
      usdcAddress && address
    ),

    onLogs(logs) {
      const relevant = logs.filter(
        (log) =>
          log.args.from?.toLowerCase() ===
            address?.toLowerCase() ||
          log.args.to?.toLowerCase() ===
            address?.toLowerCase()
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
            Transaction History
          </h2>

          <p className="text-xs text-muted mt-1">
            Complete transfer and bridge history
            across all supported networks.
          </p>
        </div>

        <button
          onClick={() => loadHistory()}
          disabled={loading}
          className="text-xs font-mono text-brass uppercase tracking-wide disabled:opacity-50"
        >
          {loading
            ? "Loading..."
            : "Refresh"}
        </button>
      </div>

      <div className="border border-border rounded-xl bg-ledger-lines overflow-hidden shadow-glow">
        {entries.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-muted text-sm">
              No transaction history recorded yet.
            </p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto ledger-scroll divide-y divide-border">
            {entries.map((entry) => {
              if (entry.type === "bridge") {
                return (
                  <div
                    key={entry.id}
                    className="px-5 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs px-2 py-1 rounded bg-violet/10 text-violet">
                          BRIDGE
                        </span>

                        <div>
                          <p className="text-sm text-ivory">
                            {entry.sourceChain}

                            <span className="text-muted mx-2">
                              →
                            </span>

                            {entry.destinationChain}
                          </p>

                          <p className="text-xs font-mono text-muted mt-1">
                            CCTP transfer
                          </p>
                        </div>
                      </div>

                      <span className="font-mono text-ivory">
                        {entry.amount}{" "}
                        {entry.token}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span
                          className={
                            entry.status ===
                            "success"
                              ? "text-mint"
                              : entry.status ===
                                "failed"
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
                          {entry.sourceTxHash.slice(
                            0,
                            10
                          )}
                          …
                          {entry.sourceTxHash.slice(
                            -6
                          )}
                        </span>
                      )}
                    </div>

                    {entry.createdAt && (
                      <p className="mt-2 text-[10px] font-mono text-muted">
                        {new Date(
                          entry.createdAt
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={entry.id}
                  className="px-5 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono text-xs px-2 py-1 rounded ${
                          entry.direction ===
                          "in"
                            ? "bg-mint/10 text-mint"
                            : "bg-coral/10 text-coral"
                        }`}
                      >
                        {entry.direction ===
                        "in"
                          ? "IN"
                          : "OUT"}
                      </span>

                      <div>
                        <p className="text-xs font-mono text-ivory">
                          {entry.chainName}
                        </p>

                        <p className="font-mono text-muted text-xs mt-1">
                          {entry.counterparty?.slice(
                            0,
                            6
                          )}
                          …
                          {entry.counterparty?.slice(
                            -4
                          )}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`font-mono ${
                        entry.direction === "in"
                          ? "text-mint"
                          : "text-ivory"
                      }`}
                    >
                      {entry.direction === "in"
                        ? "+"
                        : "−"}
                      {entry.amount}{" "}
                      {entry.symbol}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span
                        className={
                          entry.status ===
                          "success"
                            ? "text-mint"
                            : entry.status ===
                              "failed"
                            ? "text-coral"
                            : "text-brass"
                        }
                      >
                        {entry.status ??
                          "success"}
                      </span>

                      {entry.verifiedOnChain ? (
                        <span className="text-mint">
                          ✓ Verified on-chain
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            verifyTransaction(
                              entry
                            )
                          }
                          disabled={
                            verifying ===
                            entry.txHash
                          }
                          className="text-brass disabled:opacity-50"
                        >
                          {verifying ===
                          entry.txHash
                            ? "Verifying..."
                            : "Verify on-chain"}
                        </button>
                      )}
                    </div>

                    <span className="text-xs font-mono text-muted">
                      {entry.txHash.slice(
                        0,
                        10
                      )}
                      …
                      {entry.txHash.slice(
                        -6
                      )}
                    </span>
                  </div>

                  {entry.createdAt && (
                    <p className="mt-2 text-[10px] font-mono text-muted">
                      {new Date(
                        entry.createdAt
                      ).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}