# Inflow

<div align="center">
  <img src="public/logo.png" alt="Inflow Logo" width="120" />
  <br />
</div>

> _The Bridge Between Ecosystems & The Future of Monetized APIs_

![Stacks](https://img.shields.io/badge/Stacks-Testnet-5546FF?style=for-the-badge&logo=stacks&logoColor=white)
![USDCx](https://img.shields.io/badge/USDCx-Circle-2775CA?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Sepolia](https://img.shields.io/badge/Ethereum-Sepolia-627EEA?style=for-the-badge&logo=ethereum&logoColor=white)
![x402](https://img.shields.io/badge/x402-Protocol-FF8A00?style=for-the-badge)

**Problem:** Liquidity Fragmentation & AI Agent Payments.
**Solution:** A Cross-Chain, x402-compliant invoicing protocol.

**Inflow** bridges USDC between Ethereum and Bitcoin-secured Stacks using Circle's xReserve, enabling seamless cross-chain invoicing with instant settlement. It leverages the novel **x402 protocol** to turn API endpoints into pay-per-use services, creating the first truly monetizable, spam-proof developer infrastructure on Stacks.

---

## 🎯 Challenge Integration: Programming USDCx on Stacks

Inflow directly implements Circle's xReserve protocol to facilitate bi-directional USDC bridging between Ethereum Sepolia and Stacks Testnet.

### Bridge Architecture

#### Ethereum → Stacks (Minting USDCx)

The bridge uses the `depositToRemote` function on the xReserve contract to burn USDC on Ethereum and mint USDCx on Stacks:

![Diagram](https://mermaid.ink/img/c2VxdWVuY2VEaWFncmFtCiAgICBwYXJ0aWNpcGFudCBVc2VyCiAgICBwYXJ0aWNpcGFudCBQaGFudG9tL01ldGFNYXNrCiAgICBwYXJ0aWNpcGFudCBVU0RDIChTZXBvbGlhKQogICAgcGFydGljaXBhbnQgeFJlc2VydmUgQ29udHJhY3QKICAgIHBhcnRpY2lwYW50IENpcmNsZSBGYWNpbGl0YXRvcgogICAgcGFydGljaXBhbnQgU3RhY2tzIE5ldHdvcmsKCiAgICBVc2VyLT4+UGhhbnRvbS9NZXRhTWFzazogSW5pdGlhdGUgQnJpZGdlICgxMDAgVVNEQykKICAgIFBoYW50b20vTWV0YU1hc2stPj5VU0RDIChTZXBvbGlhKTogYXBwcm92ZSh4UmVzZXJ2ZSwgMTAwZTYpCiAgICBVU0RDIChTZXBvbGlhKS0tPj5QaGFudG9tL01ldGFNYXNrOiBBcHByb3ZhbCBDb25maXJtZWQKCiAgICBQaGFudG9tL01ldGFNYXNrLT4+eFJlc2VydmUgQ29udHJhY3Q6IGRlcG9zaXRUb1JlbW90ZShhbW91bnQsIGRvbWFpbiwgcmVjaXBpZW50KQogICAgTm90ZSBvdmVyIHhSZXNlcnZlIENvbnRyYWN0OiBGdW5jdGlvbjogMHhmYWFkYjUzYjxici8+QnVybnMgVVNEQyBvbiBFdGhlcmV1bQoKICAgIHhSZXNlcnZlIENvbnRyYWN0LT4+Q2lyY2xlIEZhY2lsaXRhdG9yOiBFbWl0IERlcG9zaXRGb3JCdXJuIEV2ZW50CiAgICBDaXJjbGUgRmFjaWxpdGF0b3ItPj5TdGFja3MgTmV0d29yazogTWludCBVU0RDeCB0byByZWNpcGllbnQKICAgIFN0YWNrcyBOZXR3b3JrLS0+PlVzZXI6IDEwMCBVU0RDeCBSZWNlaXZlZA==)

**Implementation:** `src/hooks/useBridge.ts` (Lines 409-504)

- **Function Selector:** `0xfaadb53b` (`depositToRemote`)
- **Parameters:** Amount (uint256), Destination Domain (Stacks = custom ID), Recipient (Stacks address as bytes32)
- **Gas Optimization:** 300,000 gas limit for cross-chain bridging

#### Stacks → Ethereum (Burning USDCx)

Return flow uses the `burn` function on the usdcx-v1 Clarity contract:

![Diagram](https://mermaid.ink/img/c2VxdWVuY2VEaWFncmFtCiAgICBwYXJ0aWNpcGFudCBVc2VyCiAgICBwYXJ0aWNpcGFudCBIaXJvL1h2ZXJzZSBXYWxsZXQKICAgIHBhcnRpY2lwYW50IFVTREN4IENvbnRyYWN0IChTdGFja3MpCiAgICBwYXJ0aWNpcGFudCBDaXJjbGUgRmFjaWxpdGF0b3IKICAgIHBhcnRpY2lwYW50IHhSZXNlcnZlIChTZXBvbGlhKQogICAgcGFydGljaXBhbnQgRXRoZXJldW0gTmV0d29yawoKICAgIFVzZXItPj5IaXJvL1h2ZXJzZSBXYWxsZXQ6IEluaXRpYXRlIEJ1cm4gKDEwMCBVU0RDeCkKICAgIEhpcm8vWHZlcnNlIFdhbGxldC0+PlVTREN4IENvbnRyYWN0IChTdGFja3MpOiBidXJuKGFtb3VudCwgZG9tYWluOjAsIGV0aC1yZWNpcGllbnQpCiAgICBOb3RlIG92ZXIgVVNEQ3ggQ29udHJhY3QgKFN0YWNrcyk6IEJ1cm5zIFVTREN4IG9uIFN0YWNrczxici8+RG9tYWluIDAgPSBFdGhlcmV1bQoKICAgIFVTREN4IENvbnRyYWN0IChTdGFja3MpLT4+Q2lyY2xlIEZhY2lsaXRhdG9yOiBFbWl0IEJ1cm4gRXZlbnQKICAgIENpcmNsZSBGYWNpbGl0YXRvci0+PnhSZXNlcnZlIChTZXBvbGlhKTogUmVsZWFzZSBVU0RDCiAgICB4UmVzZXJ2ZSAoU2Vwb2xpYSktPj5FdGhlcmV1bSBOZXR3b3JrOiBUcmFuc2ZlciB0byByZWNpcGllbnQKICAgIEV0aGVyZXVtIE5ldHdvcmstLT4+VXNlcjogMTAwIFVTREMgUmVjZWl2ZWQ=)

**Implementation:** `src/hooks/useBridge.ts` (Lines 509-593)

- **Contract:** `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1`
- **Post Conditions:** Enforces token burn via Clarity's `ft-postcondition`
- **Address Encoding:** Ethereum addresses converted to 32-byte buffers

---

## 💡 Innovation: The x402 Payment Protocol

Inflow introduces **HTTP 402 (Payment Required)** as a native blockchain monetization layer. Every API call to create invoices, fetch data, or verify payments requires a micro-payment in STX.

### How x402 Works

![Diagram](https://mermaid.ink/img/c2VxdWVuY2VEaWFncmFtCiAgICBwYXJ0aWNpcGFudCBDbGllbnQKICAgIHBhcnRpY2lwYW50IEluZmxvdyBBUEkKICAgIHBhcnRpY2lwYW50IHg0MDIgTWlkZGxld2FyZQogICAgcGFydGljaXBhbnQgU3RhY2tzIEJsb2NrY2hhaW4KICAgIHBhcnRpY2lwYW50IEZhY2lsaXRhdG9yCgogICAgQ2xpZW50LT4+SW5mbG93IEFQSTogUE9TVCAvYXBpL3YxL2ludm9pY2VzIChubyBwYXltZW50KQogICAgSW5mbG93IEFQSS0+Png0MDIgTWlkZGxld2FyZTogSW50ZXJjZXB0IFJlcXVlc3QKCiAgICBhbHQgTm8gWC1QQVlNRU5UIEhlYWRlcgogICAgICAgIHg0MDIgTWlkZGxld2FyZS0tPj5DbGllbnQ6IDQwMiBQYXltZW50IFJlcXVpcmVkCiAgICAgICAgTm90ZSBvdmVyIENsaWVudCx4NDAyIE1pZGRsZXdhcmU6IHs8YnIvPiAgcGF5VG86ICJTVDFQUS4uLiIsPGJyLz4gIGFtb3VudDogIjAuMDAxIFNUWCIsPGJyLz4gIG5vbmNlOiAidXVpZCI8YnIvPn0KCiAgICAgICAgQ2xpZW50LT4+Q2xpZW50OiBTaWduIFNUWCBUcmFuc2FjdGlvbgogICAgICAgIENsaWVudC0+PkluZmxvdyBBUEk6IFJldHJ5IHdpdGggWC1QQVlNRU5UIGhlYWRlcgogICAgZW5kCgogICAgSW5mbG93IEFQSS0+Png0MDIgTWlkZGxld2FyZTogVmVyaWZ5IFBheW1lbnQKICAgIHg0MDIgTWlkZGxld2FyZS0+PkZhY2lsaXRhdG9yOiBzZXR0bGVQYXltZW50KHNpZ25lZFR4KQogICAgRmFjaWxpdGF0b3ItPj5TdGFja3MgQmxvY2tjaGFpbjogQnJvYWRjYXN0IFRyYW5zYWN0aW9uCiAgICBTdGFja3MgQmxvY2tjaGFpbi0tPj5GYWNpbGl0YXRvcjogQ29uZmlybWVkCiAgICBGYWNpbGl0YXRvci0tPj54NDAyIE1pZGRsZXdhcmU6IHsgaXNWYWxpZDogdHJ1ZSwgdHhJZCB9CgogICAgeDQwMiBNaWRkbGV3YXJlLT4+SW5mbG93IEFQSTogUGF5bWVudCBWZXJpZmllZCDinJMKICAgIEluZmxvdyBBUEktLT4+Q2xpZW50OiAyMDEgQ3JlYXRlZCArIEludm9pY2UgRGF0YQogICAgTm90ZSBvdmVyIENsaWVudCxJbmZsb3cgQVBJOiBYLVBBWU1FTlQtUkVTUE9OU0U6IGJhc2U2NCh0eElkKQ==)

**Implementation:** `src/lib/x402.ts` + `src/app/api/v1/invoices/route.ts`

### Pricing Model (Pay-Per-Action)

| Endpoint                   | Action         | Cost       |
| -------------------------- | -------------- | ---------- |
| `POST /api/v1/invoices`    | Create Invoice | 0.001 STX  |
| `GET /api/v1/invoices/:id` | Fetch Invoice  | 0.0005 STX |
| `POST /api/v1/verify`      | Verify Payment | 0.0002 STX |

**Why This Matters:** Traditional APIs rely on API keys, rate limits, and centralized authentication. x402 makes every endpoint **self-sovereign** and **spam-resistant** without needing databases or OAuth flows.

---

## 🛠️ Tech Stack & Architecture

### Frontend

- **Next.js 16** (App Router with server actions)
- **TypeScript** (Strict mode, Zod validation)
- **Tailwind CSS v4** (Custom design system)
- **Framer Motion** (Premium animations)
- **Shadcn UI** (Composable components)

### Blockchain Integration

- **`@stacks/connect`** - Stacks wallet connections (Hiro, Xverse)
- **`@stacks/wallet-sdk`** - Key management
- **`x402-stacks`** - Payment verification protocol
- **Phantom/MetaMask** - Ethereum wallet support

### Testing & Quality

- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **ESLint** - Code quality

### Smart Contracts

- **xReserve (Ethereum):** `0x...` (Sepolia)
- **USDCx (Stacks):** `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1`

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** 20+ and npm
- **Wallets:**
  - Ethereum: [Phantom](https://phantom.app/) or [MetaMask](https://metamask.io/)
  - Stacks: [Hiro Wallet](https://wallet.hiro.so/) or [Xverse](https://www.xverse.app/)
- **Testnet Tokens:**
  - Sepolia ETH (for gas): [Sepolia Faucet](https://sepoliafaucet.com/)
  - Sepolia USDC: [Circle Faucet](https://faucet.circle.com/)
  - Stacks STX: [Stacks Faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet)

### Environment Variables

Create a `.env.local` file in the root:

```env
# x402 Configuration
X402_RECEIVE_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
X402_NETWORK=testnet
X402_FACILITATOR_URL=https://x402-backend-7eby.onrender.com

# Development Only (bypasses blockchain verification)
X402_BYPASS_VERIFICATION=true

# Optional: Testing Private Key (DO NOT USE IN PRODUCTION)
STACKS_PRIVATE_KEY=your_testnet_private_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/inflow-app.git
cd inflow-app

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` and connect your wallets.

### Testing the Bridge

1. Navigate to `/dashboard/bridge`
2. Connect both Ethereum (Phantom/MetaMask) and Stacks (Hiro/Xverse) wallets
3. For **ETH → Stacks**:
   - Enter amount and recipient Stacks address
   - Approve USDC spending
   - Click "Bridge to Stacks"
4. For **Stacks → ETH**:
   - Enter amount and recipient Ethereum address
   - Confirm transaction in Stacks wallet

### Testing x402 API

Visit the demo at `/dashboard/x402-demo` or use the CLI:

```bash
# Run the verification script
npm run test
```

---

## 🏆 Why Inflow Wins: Real-World Impact

Inflow doesn't just bridge assets—it **bridges business models**. By combining Circle's institutional-grade xReserve infrastructure with the x402 protocol, we've created the foundation for a **Service-as-a-Protocol** economy on Stacks.

**Traditional Web2 APIs** require credit cards, complex authentication, and centralized billing. **Traditional Web3 APIs** rely on off-chain API keys with subscriptions. **Inflow's x402 approach** makes every endpoint a self-contained economic unit: pay instantly in STX, access immediately, no middleman.

This unlocks:

- **Spam-Proof Infrastructure:** No more rate-limiting hacks—economic cost prevents abuse
- **Micropayment Economics:** Pay fractions of a cent per API call, enabling usage-based pricing
- **AI Agent Commerce:** LLMs with wallets can autonomously pay for services (invoice generation, data access)
- **Bitcoin-Secured Finality:** Every payment inherits Stacks' PoX security model

Inflow proves that **programmable money meets programmable infrastructure**—and that future is built on USDCx and Stacks.

---

## 🗺️ Roadmap

### Advanced Commerce (Q1 2026)

- **Entire Design Overhaul**: A fresh, premium aesthetic to match the future of finance.
- **Recurring Subscriptions**: Enabling SaaS & newsletters to bill in USDCx.
- **Escrow Milestones**: "Trustless" payments for freelancers (funds held until work is approved).

### The Fiat Bridge (Q2 2026)

- **Direct-to-Bank Payouts**: One-click off-ramping from USDCx directly to local fiat currencies (NGN, KES, USD).
- **Stablecoin-to-Bills**: Pay real-world utilities directly from the Inflow dashboard.

### Ecosystem Expansion (Q3 2026)

- **SDK Development**: Empowering other developers to build on Inflow's infrastructure.
- **DAO Payroll Integration**: Batch processing for organizations to pay huge teams in one click.
- **Mainnet Launch**: Full deployment alongside the Stacks Nakamoto upgrade.

---

## 📚 Documentation

- [x402 Protocol Spec](https://github.com/x402-stacks/x402-stacks)
- [Circle xReserve Docs](https://developers.circle.com/xreserve)
- [Stacks Documentation](https://docs.stacks.co/)

## 📄 License

MIT License - See LICENSE file for details.

---

**Built with ❤️ by Inflow Contributors on Stacks** | [Live Demo](https://inflow.app) | [GitHub](https://github.com/yourusername/inflow-app)
