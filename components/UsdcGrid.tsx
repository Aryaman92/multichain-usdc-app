"use client";

import { useAccount } from "wagmi";
import { useUsdcAcrossNetworks } from "@/lib/useBalances";

function shortenAddr(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export function UsdcGrid() {
  const { isConnected, chainId } = useAccount();
  const { balances, isLoading } = useUsdcAcrossNetworks();

  if (!isConnected) return null;

  const total = balances.reduce((sum, b) => sum + Number(b.formatted.replace(/,/g, "")), 0);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display font-medium text-ivory">USDC across networks</h2>
        <span className="font-mono text-sm text-muted tick">
          {isLoading ? "loading…" : `${total.toLocaleString()} USDC total`}
        </span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {balances.map((b) => {
          const active = chainId === b.network.id;
          const isArc = b.network.name.startsWith("Arc");
          return (
            <div
              key={b.network.id}
              className={`border rounded-lg p-5 ${
                active ? "border-brass/50 bg-panel" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-ivory flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isArc ? "bg-mint" : "bg-brass"
                    }`}
                  />
                  {b.network.name}
                </span>
                {active && (
                  <span className="text-[10px] font-mono text-brass uppercase tracking-wide">
                    active
                  </span>
                )}
              </div>
              <p className="font-mono text-2xl text-ivory tick">
                {isLoading ? "…" : b.formatted}
                <span className="text-sm text-muted ml-1.5">USDC</span>
              </p>
              <p className="text-xs font-mono text-muted mt-2 truncate">
                {shortenAddr(b.contractAddress)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
