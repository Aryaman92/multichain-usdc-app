import { Header } from "@/components/Header";
import { NetworkTabs } from "@/components/NetworkTabs";
import { AccountCard } from "@/components/AccountCard";
import { UsdcGrid } from "@/components/UsdcGrid";
import { FaucetCard } from "@/components/FaucetCard";
import { LedgerFeed } from "@/components/LedgerFeed";
import { WalletConnect } from "@/components/WalletConnect";
import { SendUsdc } from "@/components/SendUsdc";
import { BridgeToArc } from "@/components/BridgeToArc";
import { ReconciliationPanel } from "@/components/ReconciliationPanel";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 sm:px-10 py-10 space-y-10">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ivory tracking-tight">
            Your position, across four ledgers
          </h1>

          <p className="text-muted mt-2 max-w-xl">
            One key, four independent chains. Every figure below is read live —
            nothing here is assumed.
          </p>
        </div>

        <NetworkTabs />

        <AccountCard />

        <FaucetCard />

        <UsdcGrid />

        <SendUsdc />

        <BridgeToArc />

        <LedgerFeed />

        <ReconciliationPanel />
      </main>

      <footer className="border-t border-border px-6 sm:px-10 py-6 flex items-center justify-between">
        <p className="text-xs font-mono text-muted">
          Arc Testnet · Ethereum Sepolia · Base Sepolia · Avalanche Fuji
        </p>

        <div className="sm:hidden">
          <WalletConnect />
        </div>
      </footer>
    </div>
  );
}