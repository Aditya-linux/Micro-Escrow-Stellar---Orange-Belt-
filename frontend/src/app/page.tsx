"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@/context/WalletProvider";
import { useTheme } from "@/context/ThemeProvider";
import {
  Account,
  Address,
  Contract,
  TransactionBuilder,
  rpc,
  xdr,
  Networks,
  TimeoutInfinite,
  scValToNative,
  nativeToScVal,
} from "@stellar/stellar-sdk";
import { Loader2, CheckCircle, Lock, Hammer, Coins, LogOut, Wallet, Sun, Moon, Shield, ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import WalletModal from "@/components/WalletModal";

const CONTRACT_ID = "CBXXR64NKDHSUVDNFSRCT4L3EHB5EGNNWI5U2M6OXA6JZK7HD2CEK3IR";
const XLM_TOKEN_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

enum EscrowState {
  Pending = 0,
  Submitted = 1,
  Released = 2,
  Unknown = -1,
}

const steps = [
  { label: "Initialize", icon: Lock, description: "Lock funds in escrow" },
  { label: "Submit Work", icon: Hammer, description: "Freelancer delivers" },
  { label: "Release", icon: Coins, description: "Funds released" },
];

const walletBadgeConfig: Record<string, { bg: string; text: string }> = {
  freighter: { bg: "bg-violet-500/15 dark:bg-violet-500/20", text: "text-violet-600 dark:text-violet-400" },
  albedo: { bg: "bg-blue-500/15 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400" },
  xbull: { bg: "bg-amber-500/15 dark:bg-amber-500/20", text: "text-amber-600 dark:text-amber-400" },
};

export default function Home() {
  const { address, walletType, isConnected, signTransaction, disconnect } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [contractState, setContractState] = useState<EscrowState>(EscrowState.Unknown);
  const [isLoading, setIsLoading] = useState(false);
  const [freelancerAddr, setFreelancerAddr] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchContractState = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const server = new rpc.Server(RPC_URL);
      const contract = new Contract(CONTRACT_ID);
      const operation = contract.call("get_state");
      const tx = new TransactionBuilder(
        new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
        { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
      )
        .addOperation(operation)
        .setTimeout(TimeoutInfinite)
        .build();

      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(sim)) {
        const result = sim.result?.retval;
        if (result) setContractState(scValToNative(result) as EscrowState);
      }
    } catch (e) {
      console.error("Error fetching state:", e);
    }
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    if (isConnected) fetchContractState();
  }, [isConnected, fetchContractState]);

  const submitTx = async (operation: xdr.Operation, note: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const server = new rpc.Server(RPC_URL);
      const account = await server.getAccount(address);
      const tx = new TransactionBuilder(account, {
        fee: "1000000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(operation)
        .setTimeout(TimeoutInfinite)
        .build();

      const preparedTx = await server.prepareTransaction(tx);
      const signedXdr = await signTransaction(preparedTx.toXDR(), NETWORK_PASSPHRASE);
      const result = await server.sendTransaction(
        TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
      );

      if ((result.status as string) !== "PENDING") {
        const errorMsg = (result as any).errorResult
          ? JSON.stringify((result as any).errorResult)
          : JSON.stringify(result);
        throw new Error(`Transaction failed (${result.status}): ${errorMsg}`);
      }

      let status: string = result.status;
      let response = null;
      const hash = result.hash;

      while (status === "PENDING" || status === "NOT_FOUND") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        response = await server.getTransaction(hash);
        status = response.status as string;
      }

      if (status === "SUCCESS") {
        alert(`${note} Successful!`);
        await fetchContractState();
      } else {
        alert(`${note} Failed!`);
        console.error(response);
      }
    } catch (e) {
      console.error(e);
      alert(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setIsLoading(false);
  };

  const initializeEscrow = async () => {
    if (!freelancerAddr) {
      alert("Please enter freelancer address");
      return;
    }
    const amountScVal = nativeToScVal(1000000000, { type: "i128" } as any);
    const clientScVal = new Address(address).toScVal();
    const freelancerScVal = new Address(freelancerAddr).toScVal();
    const tokenScVal = new Contract(XLM_TOKEN_ID).address().toScVal();
    const contract = new Contract(CONTRACT_ID);
    const op = contract.call("initialize", clientScVal, freelancerScVal, tokenScVal, amountScVal);
    await submitTx(op, "Initialize Escrow");
  };

  const submitWork = async () => {
    const contract = new Contract(CONTRACT_ID);
    const freelancerScVal = new Address(address).toScVal();
    const op = contract.call("submit_work_link", freelancerScVal);
    await submitTx(op, "Submit Work");
  };

  const releaseFunds = async () => {
    const contract = new Contract(CONTRACT_ID);
    const clientScVal = new Address(address).toScVal();
    const op = contract.call("release_funds", clientScVal);
    await submitTx(op, "Release Funds");
  };

  const currentStep =
    contractState === EscrowState.Released
      ? 3
      : contractState === EscrowState.Submitted
        ? 2
        : contractState === EscrowState.Pending
          ? 1
          : 0;

  return (
    <div className="min-h-screen gradient-bg">
      {/* ── Header / Navbar ── */}
      <header className="sticky top-0 z-40 glass border-b border-white/10 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Micro-Escrow</h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5 font-medium uppercase tracking-widest">Stellar Testnet</p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl glass-card flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-purple-600" />
              )}
            </button>

            {/* Wallet connection */}
            {!isConnected ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Connect</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {walletType && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${walletBadgeConfig[walletType]?.bg} ${walletBadgeConfig[walletType]?.text}`}>
                    {walletType.charAt(0).toUpperCase() + walletType.slice(1)}
                  </span>
                )}
                <div className="h-9 px-3 rounded-xl glass-card flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-mono font-medium">
                    {address.slice(0, 4)}…{address.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={disconnect}
                  className="h-9 w-9 rounded-xl glass-card flex items-center justify-center hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all duration-200 group"
                  title="Disconnect"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Hero section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-xs font-medium text-muted-foreground mb-4">
            <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
            Powered by Soroban Smart Contracts
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Trustless{" "}
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              Escrow
            </span>{" "}
            Payments
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            Lock funds in a smart contract. Release only when work is delivered.
            No middlemen, no chargebacks.
          </p>
        </div>

        {/* ── Progress Stepper ── */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Escrow Progress</h3>
            <button
              onClick={fetchContractState}
              disabled={isRefreshing}
              className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              title="Refresh state"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="flex items-center gap-0 mt-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isComplete = i < currentStep;
              const isActive = i === currentStep && currentStep < 3;
              const isLast = i === steps.length - 1;

              return (
                <div key={step.label} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
                  {/* Step circle */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-500 ${isComplete
                        ? "bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg shadow-purple-500/30"
                        : isActive
                          ? "bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-purple-500 dark:text-purple-400 ring-2 ring-purple-500/40"
                          : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {isComplete ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] mt-2 font-medium transition-colors ${isComplete
                        ? "text-purple-600 dark:text-purple-400"
                        : isActive
                          ? "text-foreground"
                          : "text-muted-foreground"
                        }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div className="flex-1 mx-3 h-0.5 rounded-full bg-muted overflow-hidden mt-[-18px]">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-700 ease-out"
                        style={{ width: isComplete ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Status Card ── */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Current Status</h3>
            <div
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${contractState === EscrowState.Unknown
                ? "bg-slate-500/10 text-slate-500"
                : contractState === EscrowState.Pending
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : contractState === EscrowState.Submitted
                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                }`}
            >
              {contractState === EscrowState.Unknown && "Not Initialized"}
              {contractState === EscrowState.Pending && "Funds Locked"}
              {contractState === EscrowState.Submitted && "Work Submitted"}
              {contractState === EscrowState.Released && "Completed"}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold">100</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">XLM Locked</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold">2</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Parties</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold">{currentStep}/3</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Steps Done</p>
            </div>
          </div>

          {/* State specific details */}
          <div className="rounded-xl bg-muted/30 border border-border/50 p-4 flex items-center gap-4">
            {contractState === EscrowState.Unknown && (
              <>
                <div className="h-10 w-10 rounded-xl bg-slate-500/10 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">No Active Escrow</p>
                  <p className="text-xs text-muted-foreground">Initialize an escrow to lock 100 XLM for a freelancer.</p>
                </div>
              </>
            )}
            {contractState === EscrowState.Pending && (
              <>
                <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Funds Locked — 100 XLM</p>
                  <p className="text-xs text-muted-foreground">Waiting for the freelancer to submit proof of work.</p>
                </div>
              </>
            )}
            {contractState === EscrowState.Submitted && (
              <>
                <div className="h-10 w-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                  <Hammer className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Work Delivered</p>
                  <p className="text-xs text-muted-foreground">Client can now review and release the funds.</p>
                </div>
              </>
            )}
            {contractState === EscrowState.Released && (
              <>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Escrow Complete</p>
                  <p className="text-xs text-muted-foreground">Funds have been released to the freelancer.</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Action Card ── */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4">Actions</h3>

          {!isConnected ? (
            <div className="text-center py-8">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500/15 to-blue-500/15 flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-7 w-7 text-purple-500" />
              </div>
              <p className="text-sm font-medium mb-1">Connect Your Wallet</p>
              <p className="text-xs text-muted-foreground mb-5">
                Connect a Stellar wallet to interact with the escrow contract.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white text-sm font-semibold hover:shadow-xl hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {contractState === EscrowState.Unknown && (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Freelancer Address
                    </label>
                    <input
                      type="text"
                      placeholder="G..."
                      className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent transition-all"
                      value={freelancerAddr}
                      onChange={(e) => setFreelancerAddr(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={initializeEscrow}
                    disabled={isLoading || !freelancerAddr}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-purple-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-200"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Initialize Escrow — 100 XLM
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </>
              )}

              {contractState === EscrowState.Pending && (
                <button
                  onClick={submitWork}
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Hammer className="h-4 w-4" />
                      Submit Work (Freelancer)
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}

              {contractState === EscrowState.Submitted && (
                <button
                  onClick={releaseFunds}
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Coins className="h-4 w-4" />
                      Release Funds (Client)
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}

              {contractState === EscrowState.Released && (
                <div className="text-center py-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium">Escrow Complete</p>
                  <p className="text-xs text-muted-foreground">All funds have been released successfully.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Contract Info Footer ── */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="font-mono">
            Contract: {CONTRACT_ID.slice(0, 6)}…{CONTRACT_ID.slice(-4)}
          </span>
          <span>•</span>
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-purple-500 transition-colors"
          >
            View on Explorer
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </main>

      {/* Wallet Selection Modal */}
      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
