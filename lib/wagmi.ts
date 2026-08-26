import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SUPPORTED_NETWORKS } from "./chains";

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  // AppKit needs a project ID from https://dashboard.reown.com
  // The app will still build without one, but wallet connect will fail at runtime.
  console.warn("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set.");
}

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId: projectId ?? "",
  networks: SUPPORTED_NETWORKS,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
