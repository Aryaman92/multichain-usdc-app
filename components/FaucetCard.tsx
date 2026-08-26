"use client";

import { useAccount } from "wagmi";
import { SUPPORTED_NETWORKS } from "@/lib/chains";

export function FaucetCard() {
  const { address, chainId, isConnected } = useAccount();
  if (!isConnected) return null;

  const network = SUPPORTED_NETWORKS.find((n) => n.id === chainId);
  const explorerUrl =
    network?.blockExplorers?.default && address
      ? `${network.blockExplorers.default.url}/address/${address}`
      : undefined;

  return (
    <div className="border border-border rounded-lg p-5 flex items-center justify-between flex-wrap gap-3">
      <div>
        <p className="text-sm text-ivory font-medium">Need test funds?</p>
        <p className="text-xs text-muted mt-0.5">
          Testnet value is worthless by design — free from Circle's faucet, no real cost.
        </p>
      </div>
      <div className="flex gap-2">
        <a
          href="https://faucet.circle.com/"
          target="_blank"
          rel="noreferrer"
          className="text-sm px-4 py-2 rounded-md bg-brass text-ink font-medium hover:bg-brass/90 transition-colors"
        >
          Get test funds
        </a>
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm px-4 py-2 rounded-md border border-border text-muted hover:text-ivory hover:border-brass/50 transition-colors"
          >
            View on explorer
          </a>
        )}
      </div>
    </div>
  );
}
