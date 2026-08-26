import { defineChain } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

export const arcTestnet = defineChain({
  id: 5042002,
  caipNetworkId: "eip155:5042002",
  chainNamespace: "eip155",
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

export const ethereumSepolia = defineChain({
  id: 11155111,
  caipNetworkId: "eip155:11155111",
  chainNamespace: "eip155",
  name: "Ethereum Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.sepolia.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://sepolia.etherscan.io",
    },
  },
  testnet: true,
});

export const baseSepolia = defineChain({
  id: 84532,
  caipNetworkId: "eip155:84532",
  chainNamespace: "eip155",
  name: "Base Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia.base.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "BaseScan",
      url: "https://sepolia.basescan.org",
    },
  },
  testnet: true,
});

export const avalancheFuji = defineChain({
  id: 43113,
  caipNetworkId: "eip155:43113",
  chainNamespace: "eip155",
  name: "Avalanche Fuji",
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "SnowTrace",
      url: "https://testnet.snowtrace.io",
    },
  },
  testnet: true,
});

export const SUPPORTED_NETWORKS: [
  AppKitNetwork,
  ...AppKitNetwork[]
] = [
  arcTestnet,
  ethereumSepolia,
  baseSepolia,
  avalancheFuji,
];

export const USDC_ADDRESS: Record<number, string> = {
  [arcTestnet.id]:
    "0x3600000000000000000000000000000000000000",

  [ethereumSepolia.id]:
    "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",

  [baseSepolia.id]:
    "0x036CbD53842c5426634e7929541eC2318f3dCF7e",

  [avalancheFuji.id]:
    "0x5425890298aed601595a70AB815c96711a31Bc65",
};