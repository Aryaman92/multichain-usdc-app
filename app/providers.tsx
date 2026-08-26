"use client";

import { ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { wagmiAdapter, projectId } from "@/lib/wagmi";
import { SUPPORTED_NETWORKS, arcTestnet } from "@/lib/chains";

if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    networks: SUPPORTED_NETWORKS,
    defaultNetwork: arcTestnet,
    projectId,
    metadata: {
      name: "Multichain USDC App",
      description: "Wallet + USDC across Arc, Sepolia, Base Sepolia, Fuji",
      url: "http://localhost:3000",
      icons: [],
    },
    features: { analytics: false },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
