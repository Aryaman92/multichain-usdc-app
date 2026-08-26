"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type SessionUser = { address: string; role: string } | null;

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [user, setUser] = useState<SessionUser>(null);
  const [status, setStatus] = useState<"idle" | "signing" | "verifying" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // On load / address change, check if a session cookie is already valid.
  useEffect(() => {
    if (!isConnected) {
      setUser(null);
      return;
    }
    fetch(`${API_URL}/api/auth/session`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, [isConnected, address]);

  const signIn = useCallback(async () => {
    if (!address) return;
    setError(null);
    try {
      setStatus("signing");
      const nonceRes = await fetch(`${API_URL}/api/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      if (!nonceRes.ok) throw new Error("Couldn't get a nonce from the server.");
      const { message } = await nonceRes.json();

      const signature = await signMessageAsync({ message });

      setStatus("verifying");
      const verifyRes = await fetch(`${API_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ address, signature }),
      });
      if (!verifyRes.ok) throw new Error("Signature didn't verify.");
      const { user: verifiedUser } = await verifyRes.json();
      setUser(verifiedUser);
      setStatus("idle");
    } catch (err: any) {
      setError(err?.message ?? "Sign-in failed.");
      setStatus("error");
    }
  }, [address, signMessageAsync]);

  const signOut = useCallback(async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }, []);

  return { user, status, error, signIn, signOut };
}
