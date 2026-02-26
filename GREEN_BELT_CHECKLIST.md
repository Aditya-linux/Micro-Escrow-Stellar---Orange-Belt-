# Green Belt Submission Checklist & Git Commands

To ensure you have 8+ meaningful Git commits for your Green Belt submission, run the following exact terminal commands sequentially as you review and commit the changes made during this upgrade.

### 1. Commit: CI/CD Pipeline Setup
```bash
git add .github/workflows/ci.yml
git commit -m "ci: set up GitHub Actions for Rust contract and Next.js frontend"
```

### 2. Commit: Smart Contract Fee Collector & Events
```bash
git add contract/src/lib.rs
git commit -m "feat(contract): implement FeeCollector inter-contract call and emit state events"
```

### 3. Commit: Smart Contract Test Updates
```bash
git add contract/src/test.rs
git commit -m "test(contract): update unit tests for 2% platform fee logic and verify balances"
```

### 4. Commit: Frontend Event Listener Hook
```bash
git add frontend/src/hooks/useSorobanEvents.ts
git commit -m "feat(frontend): create useSorobanEvents hook for real-time Soroban RPC polling"
```

### 5. Commit: UI Notification Integration
```bash
git add frontend/src/app/page.tsx
git commit -m "feat(frontend): integrate live event streaming notifications into dashboard UI"
```

### 6. Commit: Mobile Responsive Design Tweaks
```bash
git add frontend/src/components/WalletModal.tsx
git commit -m "style(frontend): enhance mobile responsive layout for Wallet Modal and Neo-Brutalist elements"
```

### 7. Commit: Documentation & Green Belt Criteria
```bash
git add README.md
git commit -m "docs: update README with Green Belt submission criteria, CI badge, and Vercel links"
```

### 8. Commit: Final Polish & Preparation
```bash
git add GREEN_BELT_CHECKLIST.md task.md implementation_plan.md
git commit -m "chore: add transition tasks, checklist, and final project polish for Green Belt"
git push origin main
```
