"use client";

import { useAccount } from "wagmi";
import { SUPPORTED_NETWORKS } from "@/lib/chains";

export function AccountInfo() {
  const { address, chainId, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <p className="text-neutral-500 text-sm">
        Connect a wallet to see account and network details.
      </p>
    );
  }

  const network = SUPPORTED_NETWORKS.find((n) => n.id === chainId);

  return (
    <div className="rounded-lg border border-neutral-800 p-4 space-y-2 text-sm">
      <Row label="Address" value={address ?? "-"} />
      <Row label="Chain ID" value={chainId?.toString() ?? "unknown"} />
      <Row label="Network" value={network?.name ?? "Unrecognized network"} />
      <Row
        label="Gas token"
        value={network ? `${network.nativeCurrency.symbol}` : "-"}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-neutral-500">{label}</span>
      <span className="font-mono text-neutral-200 truncate max-w-[60%]">
        {value}
      </span>
    </div>
  );
}
