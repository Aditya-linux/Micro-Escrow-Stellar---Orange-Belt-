# Deployment Guide — Micro-Escrow dApp

Step-by-step guide for building, deploying, and managing the Micro-Escrow smart contract on Stellar Testnet.

---

## Prerequisites

| Tool | Install Command | Purpose |
|------|-----------------|---------|
| **Rust** | [rustup.rs](https://rustup.rs) | Smart contract language |
| **WASM target** | `rustup target add wasm32-unknown-unknown` | Compile to WebAssembly |
| **Soroban CLI** | `cargo install soroban-cli` | Build, deploy, invoke contracts |
| **Node.js** 18+ | [nodejs.org](https://nodejs.org) | Frontend runtime |
| **Freighter** | [Chrome Extension](https://www.freighter.app/) | Wallet for signing transactions |

---

## Step 1: Configure Soroban Identity

Create a keypair for deployment:

```powershell
soroban keys generate alice --network testnet
```

Fund it using Friendbot:

```powershell
# Get the public key
soroban keys address alice

# Fund it (open in browser or curl)
# https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY
```

Verify:

```powershell
soroban keys address alice
# Should print your G... address
```

---

## Step 2: Build the Smart Contract

```powershell
cd contract
cargo build --target wasm32-unknown-unknown --release
```

Output: `contract/target/wasm32-unknown-unknown/release/contract.wasm`

### Run Unit Tests (Optional)

```powershell
cargo test
```

---

## Step 3: Deploy to Testnet

```powershell
soroban contract deploy `
    --wasm contract/target/wasm32-unknown-unknown/release/contract.wasm `
    --source alice `
    --network testnet
```

This prints the new **Contract ID** (starts with `C...`).

**OR** use the automated script:

```powershell
.\deploy.ps1
```

The script builds, deploys, and saves the contract ID to `contract_id.txt`.

---

## Step 4: Update the Frontend

Open `frontend/src/app/page.tsx` and replace the `CONTRACT_ID` constant:

```typescript
const CONTRACT_ID = "YOUR_NEW_CONTRACT_ID_HERE";
```

---

## Step 5: Start the Frontend

```powershell
cd frontend
npm install    # first time only
npm run dev
```

Open **http://localhost:3000**

---

## Step 6: Test the Full Escrow Flow

| Step | Who | Action |
|------|-----|--------|
| 1 | **Client** | Connect wallet → Enter freelancer's G... address → Click "Initialize Escrow (100 XLM)" |
| 2 | **Freelancer** | Switch to freelancer wallet in Freighter → Click "Submit Work" |
| 3 | **Client** | Switch back to client wallet → Click "Release Funds" |

> **Note:** The Client and Freelancer must use different Stellar accounts. You can switch accounts in Freighter by clicking the account icon.

---

## Redeployment (Fresh Escrow)

The contract does **not** support re-initialization. Once an escrow reaches the "Released" state, the contract is permanently in that state. To start a new escrow:

1. **Rebuild** (if you changed the Rust code):
   ```powershell
   cd contract
   cargo build --target wasm32-unknown-unknown --release
   ```

2. **Redeploy** to get a new contract ID:
   ```powershell
   soroban contract deploy `
       --wasm contract/target/wasm32-unknown-unknown/release/contract.wasm `
       --source alice `
       --network testnet
   ```

3. **Update** `CONTRACT_ID` in `frontend/src/app/page.tsx`

4. **Refresh** the browser — the UI will show a fresh "Not Initialized" state

---

## Verifying on Stellar Explorer

You can inspect any deployed contract on the Stellar Expert explorer:

```
https://stellar.expert/explorer/testnet/contract/YOUR_CONTRACT_ID
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `soroban: command not found` | Run `cargo install soroban-cli` |
| `Account not found` | Fund the account via Friendbot |
| `txBadAuth` | Increase fee to `1000000` stroops; ensure `address` is passed to `signTransaction` |
| `Already initialized` | The contract was already used — redeploy a new one |
| `Not the authorized freelancer` | Switch to the freelancer's wallet in Freighter |
| `Invalid contract ID` | Verify the ID is exactly 56 characters, no hidden characters |
