# 🔐 Micro-Escrow dApp

A decentralized escrow application built on **Stellar Soroban** enabling trustless payments between a Client and a Freelancer. Funds are locked in a smart contract and released only when work is approved — no middlemen, no chargebacks.

> **Orange Belt Challenge** — Stellar Developer Program

---

## 📸 Screenshots

| Light Mode | Dark Mode |
|:----------:|:---------:|
| ![Light Mode](screenshots/light-mode.png) | ![Dark Mode](screenshots/dark-mode.png) |

---

## 🎬 Demo Video

> 📹 [**Watch the Demo Video**](https://drive.google.com/file/d/1z9eG-0qLOSPIsXjAgfiii24OCaNSNLM9/view?usp=sharing)

---

## 📋 How It Works

```
Client (Initialize) → Funds Locked → Freelancer (Submit Work) → Client (Release Funds) → Freelancer Paid
```

| Step | Who | Action |
|------|-----|--------|
| 1 | **Client** | Initializes escrow with 100 XLM and freelancer's address |
| 2 | **Freelancer** | Submits proof of completed work |
| 3 | **Client** | Reviews and releases locked funds to freelancer |

---

## 🛠️ Tech Stack

### Smart Contract
| Technology | Purpose |
|------------|---------|
| **Rust** | Contract language |
| **Soroban SDK** v21 | Stellar smart contract framework |
| **Soroban CLI** | Build, deploy, invoke |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 16** (Turbopack) | React framework |
| **TypeScript** | Type-safe development |
| **@stellar/stellar-sdk** v14 | Blockchain interactions |
| **Tailwind CSS 3** | Utility-first styling |
| **Lucide React** | Icons |
| **Space Grotesk** | Bold, chunky typography |

### Multi-Wallet Support
| Wallet | Type | Package |
|--------|------|---------|
| **Freighter** | Browser extension | `@stellar/freighter-api` |
| **Albedo** | Web-based (no extension) | `@albedo-link/intent` |
| **xBull** | Browser extension | `@creit.tech/xbull-wallet-connect` |

---

## 🎨 Design — Soft Neo-Brutalist

Inspired by **Panda CSS** and **Gumroad**, the UI uses a playful yet professional Neo-Brutalist design language:

| Element | Style |
|---------|-------|
| **Borders** | Thick 3px solid borders on all cards, buttons, and inputs |
| **Shadows** | Hard 4px offset shadows (no blur) with tactile press-down effects |
| **Typography** | Space Grotesk — bold, chunky, geometric sans-serif |
| **Background** | Off-white `#FFFDF7` with subtle dot-grid pattern |
| **Accent Colors** | Vibrant yellow `#FFD60A`, cyan `#00E5FF`, pink `#FF6B9D`, green `#00D68F` |
| **Interactions** | Buttons translate on hover (lift) and press down on click (shadow disappears) |
| **Dark Mode** | Full dark theme with inverted borders and preserved accent colors |

---

## ✅ Test Results

4 contract tests passing:

```
running 4 tests
test test::test_correct_initialization ... ok
test test::test_cannot_release_before_submission - should panic ... ok
test test::test_full_flow ... ok
test test::test_submit_without_init - should panic ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

---

## 📂 Project Structure

```
Micro-Escrow DApp(Orange Belt)/
├── contract/                         # Soroban smart contract (Rust)
│   ├── Cargo.toml                    # Dependencies (soroban-sdk v21)
│   └── src/
│       ├── lib.rs                    # Contract: initialize, submit_work, release_funds, get_state
│       └── test.rs                   # 4 unit tests
├── frontend/                         # Next.js frontend
│   ├── package.json
│   └── src/
│       ├── app/
│       │   ├── globals.css           # Neo-Brutalist design system & utilities
│       │   ├── layout.tsx            # Root layout with Space Grotesk font
│       │   ├── providers.tsx         # Client-side ThemeProvider + WalletProvider
│       │   └── page.tsx              # Main dApp interface
│       ├── components/
│       │   └── WalletModal.tsx       # Wallet selection modal (3 wallets)
│       └── context/
│           ├── ThemeProvider.tsx      # Dark/light mode context
│           └── WalletProvider.tsx     # Unified multi-wallet abstraction
├── screenshots/                      # UI screenshots (light & dark mode)
├── deploy.ps1                        # Automated deploy script
├── DEPLOYMENT_GUIDE.md               # Step-by-step deployment docs
├── contract_id.txt                   # Current deployed contract ID
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **npm**
- **Rust** with `wasm32-unknown-unknown` target
- **Soroban CLI** — `cargo install soroban-cli`
- A funded Stellar Testnet account

### 1. Clone & Install
```bash
git clone https://github.com/Aditya-linux/Micro-Escrow-Stellar---Orange-Belt-.git
cd Micro-Escrow-Stellar---Orange-Belt-
cd frontend && npm install
```

### 2. Build & Test Contract
```bash
cd contract
cargo build --target wasm32-unknown-unknown --release
cargo test
```

### 3. Deploy to Testnet
```powershell
.\deploy.ps1
# Copy the printed CONTRACT_ID and paste into frontend/src/app/page.tsx
```

### 4. Run Frontend
```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

---

## 🧪 Testing the Full Escrow Flow

1. Connect **Client** wallet (Freighter/Albedo/xBull)
2. Enter freelancer's `G...` address → Click **"Initialize Escrow — 100 XLM"**
3. Switch to **Freelancer** wallet → Click **"Submit Work"**
4. Switch back to **Client** wallet → Click **"Release Funds"**

> **Note:** The escrow contract is single-use. Once funds are released, redeploy a fresh contract for a new escrow. See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for details.

---

## 🐛 Issues Fixed During Development

| # | Issue | Root Cause | Fix |
|---|-------|-----------|-----|
| 1 | `Cannot find module '@stellar/stellar-sdk'` | Conflicting SDK packages | Removed legacy `stellar-sdk` |
| 2 | `HostError: UnreachableCodeReached` | `get_state()` returned Pending when uninitialized | Changed to `.expect("Not initialized")` |
| 3 | `Invalid contract ID` | Corrupted characters from shell encoding | Clean extraction via Node.js script |
| 4 | `txBadAuth` | Low fee + missing `address` in signTransaction | Fee to 1M stroops + added address param |
| 5 | `useTheme must be used within ThemeProvider` | Pre-mount early return bypassed context | Always wrap children in Provider |
| 6 | `soroban-sdk` test compilation error | Outdated SDK v20 `arbitrary` crate | Updated to v21.7.6 with new API |

---

## 📄 License

MIT
