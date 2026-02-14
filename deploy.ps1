# Deploy Micro-Escrow Contract to Testnet
# Make sure you have soroban-cli installed and configured

echo "Building contract..."
cd contract
cargo build --target wasm32-unknown-unknown --release
cd ..

echo "Deploying to Testnet..."
# Replace 'alice' with your configured identity
$ID = soroban contract deploy `
    --wasm contract/target/wasm32-unknown-unknown/release/contract.wasm `
    --source alice `
    --network testnet

$ID | Out-File -FilePath contract_id.txt -NoNewline
echo "Contract Deployed! ID: $ID"
echo "Please update frontend/src/app/page.tsx with this ID."
