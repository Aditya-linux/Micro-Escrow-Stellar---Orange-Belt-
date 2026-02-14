# 🔐 Micro-Escrow dApp

A decentralized escrow application built on **Stellar Soroban** enabling trustless payments between a Client and a Freelancer. Funds are locked in a smart contract and released only when work is approved — no middlemen, no chargebacks.

> **Orange Belt Challenge** — Stellar Developer Program

---

## 📸 Screenshots

| Dark Mode | Light Mode |
|-----------|------------|
| ![Dark Mode](https://github.com/user-attachments/assets/9a5efd94-300c-49f1-a16b-5158d788e137) | ![Light Mode]("https://github.com/user-attachments/assets/5ae51d82-6b06-4ae8-8488-5337688adc7b") |

---

## 🎬 Demo Video

> 📹 [Watch the 1-minute demo video](YOUR_DEMO_VIDEO_LINK_HERE)

---

## 🌐 Live Demo

> 🔗 [Live dApp on Vercel](https://micro-escrow-stellar-orange-belt.vercel.app/)

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
| **@stellar/stellar-sdk** | Blockchain interactions |
| **Tailwind CSS** | Utility-first styling |
| **Lucide React** | Icons |

### Multi-Wallet Support
| Wallet | Type | Package |
|--------|------|---------|
| **Freighter** | Browser extension | `@stellar/freighter-api` |
| **Albedo** | Web-based (no extension) | `@albedo-link/intent` |
| **xBull** | Browser extension | `@creit.tech/xbull-wallet-connect` |

---

## 🎨 Design Features

- **Glassmorphism UI** — Frosted glass cards with backdrop-blur
- **Dark/Light Mode** — Toggle with localStorage persistence
- **Animated Progress Stepper** — Visual escrow flow tracker
- **Gradient Action Buttons** — Color-coded per step
- **Multi-Wallet Modal** — Connect via Freighter, Albedo, or xBull
- **Purple/Blue Palette** — Modern DApp aesthetic

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
│       │   ├── globals.css           # Theme, glassmorphism, animations
│       │   ├── layout.tsx            # Root layout with providers
│       │   ├── providers.tsx         # Client-side ThemeProvider + WalletProvider
│       │   └── page.tsx              # Main dApp interface
│       ├── components/
│       │   └── WalletModal.tsx       # Wallet selection modal
│       └── context/
│           ├── ThemeProvider.tsx      # Dark/light mode context
│           └── WalletProvider.tsx     # Unified wallet abstraction
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

## 🧪 Testing the Flow

1. Connect **Client** wallet (Freighter/Albedo/xBull)
2. Enter freelancer's `G...` address → Click **"Initialize Escrow — 100 XLM"**
3. Switch to **Freelancer** wallet → Click **"Submit Work"**
4. Switch back to **Client** wallet → Click **"Release Funds"**

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
