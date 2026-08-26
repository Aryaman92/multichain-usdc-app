"use client";

import { useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { SUPPORTED_NETWORKS } from "@/lib/chains";

export function NetworkSwitcher() {
  const { chainId, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);

  if (!isConnected) return null;

  const handleSwitch = async (targetId: number) => {
    setError(null);
    try {
      // wagmi's switchChain calls wallet_switchEthereumChain under the hood.
      // If the wallet has never seen this chain, it throws error code 4902 —
      // that's the exact signal to fall into wallet_addEthereumChain instead.
      await switchChain({ chainId: targetId });
    } catch (err: any) {
      if (err?.code === 4902 || err?.cause?.code === 4902) {
        await addUnknownNetwork(targetId);
      } else {
        setError(err?.shortMessage ?? "Failed to switch network.");
      }
    }
  };

  const addUnknownNetwork = async (targetId: number) => {
    const network = SUPPORTED_NETWORKS.find((n) => n.id === targetId);
    if (!network || typeof window === "undefined" || !(window as any).ethereum) {
      setError("Wallet does not support adding networks automatically.");
      return;
    }
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
      setError(err?.message ?? "User rejected adding the network.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {SUPPORTED_NETWORKS.map((network) => {
          const active = chainId === network.id;
          return (
            <button
              key={network.id}
              disabled={isPending}
              onClick={() => handleSwitch(Number(network.id))}
              className={`text-sm px-3 py-1.5 rounded-md border ${
                active
                  ? "border-emerald-500 text-emerald-400"
                  : "border-neutral-700 hover:border-neutral-500"
              }`}
            >
              {network.name}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
