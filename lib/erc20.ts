import { arcTestnet, ethereumSepolia, baseSepolia, avalancheFuji } from "./chains";

// Minimal ERC-20 ABI — only what the app actually calls.
export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

// Verify these against Circle's official docs / docs.arc.io before relying
// on them for anything beyond this learning project.
export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  [ethereumSepolia.id]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  [baseSepolia.id]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  [avalancheFuji.id]: "0x5425890298aed601595a70AB815c96711a31Bc65",
  [arcTestnet.id]: "0x3600000000000000000000000000000000000000",
};

export const USDC_DECIMALS = 6;
