"use client";

import { useAccount, useDisconnect } from "wagmi";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted border border-border rounded-full px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-mint" />
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="text-sm font-medium px-4 py-2 rounded-md border border-border text-muted hover:text-ivory hover:border-brass/50 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return <appkit-button />;
}
