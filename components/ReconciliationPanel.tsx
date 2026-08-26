"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Summary = {
  total: number;
  matched: number;
  mismatch: number;
  missing: number;
  pending: number;
};

type Result = {
  type: "transaction" | "bridge";
  id: string;
  hash?: string;
  amount?: string;
  token?: string;
  sourceChain?: string;
  destinationChain?: string;
  databaseStatus?: string;
  chainStatus?: string;
  sourceChainStatus?: string;
  destinationChainStatus?: string;
  reconciliationStatus: "matched" | "mismatch" | "missing" | "pending";
};

export function ReconciliationPanel() {
  const { address, isConnected } = useAccount();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function reconcile() {
    if (!address) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/api/reconciliation/${address}`
      );

      if (!res.ok) {
        throw new Error("Reconciliation failed.");
      }

      const data = await res.json();

      setSummary(data.summary);
      setResults(data.results ?? []);
    } catch (err: any) {
      setError(err?.message || "Could not reconcile records.");
    } finally {
      setLoading(false);
    }
  }

  if (!isConnected) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="font-display font-medium text-ivory">
            Reconciliation
          </h2>

          <p className="text-xs text-muted mt-1">
            Compare application records against the blockchain.
          </p>
        </div>

        <button
          onClick={reconcile}
          disabled={loading}
          className="text-xs font-mono text-brass uppercase tracking-wide disabled:opacity-50"
        >
          {loading ? "Checking..." : "Run check"}
        </button>
      </div>

      <div className="border border-border rounded-xl bg-panel p-5 space-y-5 shadow-glow">
        {!summary && !error && (
          <p className="text-sm text-muted">
            Run reconciliation to verify stored activity.
          </p>
        )}

        {error && (
          <p className="text-sm text-coral">
            {error}
          </p>
        )}

        {summary && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-panel2 border border-border rounded-lg p-3">
                <p className="text-xs text-muted font-mono">TOTAL</p>
                <p className="text-xl text-ivory mt-1">
                  {summary.total}
                </p>
              </div>

              <div className="bg-panel2 border border-border rounded-lg p-3">
                <p className="text-xs text-muted font-mono">MATCHED</p>
                <p className="text-xl text-mint mt-1">
                  {summary.matched}
                </p>
              </div>

              <div className="bg-panel2 border border-border rounded-lg p-3">
                <p className="text-xs text-muted font-mono">MISMATCH</p>
                <p className="text-xl text-coral mt-1">
                  {summary.mismatch}
                </p>
              </div>

              <div className="bg-panel2 border border-border rounded-lg p-3">
                <p className="text-xs text-muted font-mono">MISSING</p>
                <p className="text-xl text-coral mt-1">
                  {summary.missing}
                </p>
              </div>

              <div className="bg-panel2 border border-border rounded-lg p-3">
                <p className="text-xs text-muted font-mono">PENDING</p>
                <p className="text-xl text-brass mt-1">
                  {summary.pending}
                </p>
              </div>
            </div>

            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {results.length === 0 ? (
                <div className="p-4 text-sm text-muted">
                  No stored records found.
                </div>
              ) : (
                results.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="p-4 bg-panel2"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted uppercase">
                            {item.type}
                          </span>

                          <span
                            className={
                              item.reconciliationStatus === "matched"
                                ? "text-mint text-xs font-mono"
                                : item.reconciliationStatus === "pending"
                                ? "text-brass text-xs font-mono"
                                : "text-coral text-xs font-mono"
                            }
                          >
                            {item.reconciliationStatus === "matched"
                              ? "✓ matched"
                              : item.reconciliationStatus}
                          </span>
                        </div>

                        {item.type === "transaction" && item.hash && (
                          <p className="text-xs font-mono text-muted mt-2">
                            {item.hash.slice(0, 12)}…
                            {item.hash.slice(-8)}
                          </p>
                        )}

                        {item.type === "bridge" && (
                          <p className="text-xs text-muted mt-2">
                            {item.sourceChain} → {item.destinationChain}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        {item.type === "transaction" && (
                          <>
                            <p className="text-xs text-muted">
                              DB: {item.databaseStatus}
                            </p>
                            <p className="text-xs text-muted mt-1">
                              Chain: {item.chainStatus}
                            </p>
                          </>
                        )}

                        {item.type === "bridge" && (
                          <>
                            <p className="text-xs text-muted">
                              {item.amount} {item.token}
                            </p>

                            <p className="text-xs text-muted mt-1">
                              Source: {item.sourceChainStatus}
                            </p>

                            <p className="text-xs text-muted mt-1">
                              Destination: {item.destinationChainStatus}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}