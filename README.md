# Multichain USDC app — Ledger

A wallet dashboard across Arc Testnet, Ethereum Sepolia, Base Sepolia, and Avalanche Fuji, with a real backend for signature-based sign-in.

Two parts, run separately:
- `/` — Next.js frontend (port 3000)
- `/server` — Express + MongoDB backend (port 4000)

## 1. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Fill in `.env`:
- `MONGODB_URI` — a local MongoDB, or a free MongoDB Atlas cluster connection string
- `SESSION_SECRET` — generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

Then:

```bash
npm run dev
```

Confirm it's up: `curl http://localhost:4000/api/health` should return `{"ok":true}`.

## 2. Frontend setup

```bash
cd ..   # back to project root
npm install
cp .env.example .env.local
```

Get a free WalletConnect/Reown project ID at https://dashboard.reown.com and add it to `.env.local`:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id_here
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Then:

```bash
npm run dev
```

Open http://localhost:3000. Both servers need to be running at once.

## What's implemented

**Frontend**
- `lib/chains.ts` — network config for all four chains (chain ID, RPC, gas token, explorer). Single source of truth.
- `lib/erc20.ts` — minimal ERC-20 ABI + USDC contract addresses per chain.
- `lib/useBalances.ts` — native balance (current network) + USDC balance across all four networks in parallel, independent of the wallet's active chain.
- `lib/useAuth.ts` — the nonce → sign → verify → session flow, talking to the real backend.
- `components/NetworkTabs.tsx` — switches networks; falls back to `wallet_addEthereumChain` if the wallet doesn't know a chain yet.
- `components/AccountCard.tsx` — address, network, native balance, sign-in status.
- `components/UsdcGrid.tsx` — USDC balance per network, each figure traceable to its contract address.
- `components/FaucetCard.tsx` — links out to Circle's faucet + block explorer.
- `components/LedgerFeed.tsx` — live feed of real `Transfer` events involving your address on the current network.

**Backend**
- `routes/auth.js` — `/api/auth/nonce`, `/api/auth/verify` (real `viem.verifyMessage` check), `/api/auth/session`, `/api/auth/logout`. Nonces are single-use and expire after 5 minutes (MongoDB TTL index).
- `routes/faucet.js` — rate-limits funding requests per address+chain on top of Circle's own limits, then hands back the faucet URL.
- `models/User.js`, `models/Nonce.js` — Mongoose schemas.

## What's intentionally not built yet

- USDC transfers (sending) and the activity/receipt-tracking view — Phase 6.
- Cross-chain bridging via CCTP/Bridge Kit — Phase 7.
- Reconciliation view — Phase 8.
- The `LedgerFeed` component watches events live but doesn't persist them to MongoDB yet — that's part of Phase 6's activity storage.

## Verify before you rely on it

- USDC contract addresses in `lib/erc20.ts` were taken from a working session's confirmed balances — double-check them against Circle's official docs before trusting them for anything beyond learning.
- Arc's chain ID and RPC URL should be re-checked against `https://docs.arc.io` periodically — these are still early and can change.
