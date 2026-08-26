"use client";

import { useAccount, useBalance, useReadContracts } from "wagmi";
import { SUPPORTED_NETWORKS } from "./chains";
import { erc20Abi, USDC_ADDRESSES, USDC_DECIMALS } from "./erc20";

export function useNativeBalance() {
  const { address, chainId } = useAccount();
  return useBalance({
    address,
    chainId,
    query: { enabled: Boolean(address && chainId), refetchInterval: 15_000 },
  });
}

// Reads USDC balanceOf(address) on all four chains in parallel — each call
// is pinned to its own chainId, independent of which network the wallet is
// currently switched to. This is what makes the "across networks" view work.
export function useUsdcAcrossNetworks() {
  const { address } = useAccount();

  const contracts = SUPPORTED_NETWORKS.map((network) => {
    const id = Number(network.id);
    return {
      address: USDC_ADDRESSES[id],
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: address ? [address] : undefined,
      chainId: id,
    };
  });

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: Boolean(address), refetchInterval: 15_000 },
  });

  const balances = SUPPORTED_NETWORKS.map((network, i) => {
    const id = Number(network.id);
    const result = data?.[i];
    const raw = result?.status === "success" ? (result.result as bigint) : BigInt(0);
    return {
      network,
      contractAddress: USDC_ADDRESSES[id],
      raw,
      formatted: (Number(raw) / 10 ** USDC_DECIMALS).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      }),
    };
  });

  return { balances, isLoading, refetch };
}
