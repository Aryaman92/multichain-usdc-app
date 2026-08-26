"use client";

import { useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { SUPPORTED_NETWORKS } from "@/lib/chains";

export function NetworkTabs() {
  const { chainId, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  if (!isConnected) return null;

  const handleSwitch = async (targetId: number) => {
    setError(null);
    try {
      await switchChain({ chainId: targetId });
    } catch (err: any) {
      if (err?.code === 4902 || err?.cause?.code === 4902) {
        await addUnknownNetwork(targetId);
      } else {
        setError(err?.shortMessage ?? "Couldn't switch network.");
      }
    }
  };

  const addUnknownNetwork = async (targetId: number) => {
    const network = SUPPORTED_NETWORKS.find((n) => n.id === targetId);
    if (!network || typeof window === "undefined" || !(window as any).ethereum) {
      setError("This wallet can't add networks automatically.");
      return;
    }
    setAddingId(targetId);
    try {
      await (window as any).ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${targetId.toString(16)}`,
            chainName: network.name,
            nativeCurrency: network.nativeCurrency,
            rpcUrls: network.rpcUrls.default.http,
            blockExplorerUrls: network.blockExplorers?.default
              ? [network.blockExplorers.default.url]
              : [],
          },
        ],
      });
    } catch (err: any) {
      setError(err?.message ?? "Network was not added.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div>
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {SUPPORTED_NETWORKS.map((network) => {
          const active = chainId === network.id;
          const isArc = network.name.startsWith("Arc");
          return (
            <button
              key={network.id}
              disabled={isPending || addingId === network.id}
              onClick={() => handleSwitch(Number(network.id))}
              className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                active ? "text-ivory" : "text-muted hover:text-ivory"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    active ? (isArc ? "bg-mint" : "bg-brass") : "bg-border"
                  }`}
                />
                {network.name}
                {addingId === network.id && (
                  <span className="text-xs text-muted font-mono">adding…</span>
                )}
              </span>
              {active && (
                <span
                  className={`absolute left-0 right-0 -bottom-px h-[2px] ${
                    isArc ? "bg-mint" : "bg-brass"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-coral mt-2">{error}</p>}
    </div>
  );
}
