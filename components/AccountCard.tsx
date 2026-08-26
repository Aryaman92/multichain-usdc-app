"use client";

import { useAccount } from "wagmi";
import { SUPPORTED_NETWORKS } from "@/lib/chains";
import { useNativeBalance } from "@/lib/useBalances";
import { useAuth } from "@/lib/useAuth";

export function AccountCard() {
  const { address, chainId, isConnected } = useAccount();
  const { data: nativeBalance, isLoading: balanceLoading } = useNativeBalance();
  const { user, status, error, signIn, signOut } = useAuth();

  if (!isConnected) {
    return (
      <div className="border border-border rounded-lg p-8 text-center">
        <p className="text-muted text-sm">
          Connect a wallet to see your account and balances.
        </p>
      </div>
    );
  }

  const network = SUPPORTED_NETWORKS.find((n) => n.id === chainId);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-border bg-panel">
        <p className="text-xs font-mono text-muted uppercase tracking-wide mb-1">
          Address
        </p>
        <p className="font-mono text-sm text-ivory break-all">{address}</p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <div className="px-6 py-5">
          <p className="text-xs font-mono text-muted uppercase tracking-wide mb-1">
            Network
          </p>
          <p className="text-ivory font-medium">
            {network?.name ?? "Unrecognized"}
          </p>
          <p className="text-xs font-mono text-muted mt-0.5">
            chain id {chainId}
          </p>
        </div>
        <div className="px-6 py-5">
          <p className="text-xs font-mono text-muted uppercase tracking-wide mb-1">
            Native balance
          </p>
          <p className="font-mono text-ivory tick">
            {balanceLoading
              ? "…"
              : `${
                  nativeBalance
                    ? (Number(nativeBalance.value) / 10 ** nativeBalance.decimals).toFixed(4)
                    : "0"
                } ${nativeBalance?.symbol ?? network?.nativeCurrency.symbol ?? ""}`}
          </p>
        </div>
      </div>

      <div className="px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono text-muted uppercase tracking-wide mb-1">
            Session
          </p>
          {user ? (
            <p className="text-mint text-sm font-medium">
              Signed in · role: {user.role}
            </p>
          ) : (
            <p className="text-muted text-sm">Not signed in</p>
          )}
        </div>
        {user ? (
          <button
            onClick={signOut}
            className="text-sm px-4 py-2 rounded-md border border-border text-muted hover:text-ivory hover:border-brass/50 transition-colors"
          >
            Sign out
          </button>
        ) : (
          <button
            onClick={signIn}
            disabled={status === "signing" || status === "verifying"}
            className="text-sm px-4 py-2 rounded-md bg-brass text-ink font-medium hover:bg-brass/90 transition-colors disabled:opacity-60"
          >
            {status === "signing"
              ? "Waiting for signature…"
              : status === "verifying"
              ? "Verifying…"
              : "Sign in"}
          </button>
        )}
      </div>
      {error && <p className="px-6 pb-4 text-sm text-coral">{error}</p>}
    </div>
  );
}
