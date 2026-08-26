"use client";

import { WalletConnect } from "@/components/WalletConnect";

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="max-w-4xl mx-auto px-6 sm:px-10 py-5 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold text-ivory">
              ARM.
            </span>

            <span className="text-xs font-mono text-muted uppercase tracking-wide">
              Across Real Multichains
            </span>
          </div>

          <p className="text-xs text-muted mt-1">
            One identity. Multiple networks.
          </p>
        </div>

        <WalletConnect />
      </div>
    </header>
  );
}