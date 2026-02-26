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
import { Loader2, CheckCircle, Lock, Hammer, Coins, LogOut, Wallet, Sun, Moon, Shield, ArrowRight, ExternalLink, RefreshCw, Bell } from "lucide-react";
import WalletModal from "@/components/WalletModal";
import { useSorobanEvents } from "@/hooks/useSorobanEvents";

const CONTRACT_ID = "CCW4OSLZPQUGVSTTZR4H77R4MFPJFPR4UMWDYH6CLMGGJN6VOXFHRJZB";
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
  freighter: { bg: "bg-neo-yellow/30", text: "text-foreground" },
  albedo: { bg: "bg-neo-cyan/30", text: "text-foreground" },
  xbull: { bg: "bg-neo-orange/30", text: "text-foreground" },
};

export default function Home() {
  const { address, walletType, isConnected, signTransaction, disconnect } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [contractState, setContractState] = useState<EscrowState>(EscrowState.Unknown);
  const [isLoading, setIsLoading] = useState(false);
  const [freelancerAddr, setFreelancerAddr] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentEvent, setRecentEvent] = useState<{ name: string, data: any } | null>(null);

  useSorobanEvents(CONTRACT_ID, RPC_URL, (eventName, eventData) => {
    setRecentEvent({ name: eventName, data: eventData });
    // Clear toast after 5s
    setTimeout(() => setRecentEvent(null), 5000);
    // Refresh state
    fetchContractState();
  });

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
    <div className="min-h-screen dot-grid">
      {/* ── Header / Navbar ── */}
      <header className="sticky top-0 z-40 bg-background border-b-3 border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-neo-yellow border-3 border-foreground flex items-center justify-center neo-shadow-sm">
              <Shield className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Micro-Escrow</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Stellar Testnet</p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="h-10 w-10 rounded-lg border-3 border-foreground bg-card flex items-center justify-center neo-shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-neo-yellow" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </button>

            {/* Wallet connection */}
            {!isConnected ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="h-10 px-5 rounded-lg bg-neo-yellow text-foreground text-sm font-bold flex items-center gap-2 neo-btn"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Connect</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {walletType && (
                  <span className={`neo-badge ${walletBadgeConfig[walletType]?.bg} ${walletBadgeConfig[walletType]?.text}`}>
                    {walletType.charAt(0).toUpperCase() + walletType.slice(1)}
                  </span>
                )}
                <div className="h-10 px-3 rounded-lg border-3 border-foreground bg-card flex items-center gap-2 neo-shadow-sm">
                  <div className="h-2.5 w-2.5 rounded-full bg-neo-green border-2 border-foreground" />
                  <span className="text-sm font-mono font-bold">
                    {address.slice(0, 4)}…{address.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={disconnect}
                  className="h-10 w-10 rounded-lg border-3 border-foreground bg-card flex items-center justify-center neo-shadow-sm hover:bg-neo-red/15 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 group"
                  title="Disconnect"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-neo-red transition-colors" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Event Toast Notification */}
      {recentEvent && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
          <div className="bg-card border-3 border-foreground rounded-xl p-4 neo-shadow flex items-start gap-4 max-w-sm">
            <div className="h-10 w-10 shrink-0 bg-neo-green/20 border-3 border-foreground rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight mb-1">Contract Event</p>
              <p className="text-xs text-muted-foreground font-medium">
                <span className="text-foreground tracking-wide font-bold">{recentEvent.name}</span> detected.
              </p>
            </div>
            <button onClick={() => setRecentEvent(null)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Hero section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neo-cyan/20 border-3 border-foreground neo-shadow-sm text-xs font-bold uppercase tracking-wider mb-5">
            <div className="h-2 w-2 rounded-full bg-neo-cyan border-2 border-foreground" />
            Powered by Soroban
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">
            Trustless{" "}
            <span className="bg-neo-yellow px-2 py-0.5 border-3 border-foreground rounded-lg inline-block neo-shadow-sm">
              Escrow
            </span>{" "}
            Payments
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-base leading-relaxed font-medium">
            Lock funds in a smart contract. Release only when work is delivered.
            No middlemen, no chargebacks.
          </p>
        </div>

        {/* ── Progress Stepper ── */}
        <div className="neo-card p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider">Escrow Progress</h3>
            <button
              onClick={fetchContractState}
              disabled={isRefreshing}
              className="h-8 w-8 rounded-lg border-3 border-foreground bg-card flex items-center justify-center hover:bg-muted transition-colors active:translate-x-[1px] active:translate-y-[1px]"
              title="Refresh state"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-foreground ${isRefreshing ? "animate-spin" : ""}`} />
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
                      className={`h-12 w-12 rounded-lg border-3 flex items-center justify-center transition-all duration-300 ${isComplete
                        ? "bg-neo-yellow border-foreground neo-shadow-sm text-foreground"
                        : isActive
                          ? "bg-neo-cyan/20 border-foreground neo-shadow-sm text-foreground ring-2 ring-neo-cyan ring-offset-2 ring-offset-background"
                          : "bg-muted border-foreground/30 text-muted-foreground"
                        }`}
                    >
                      {isComplete ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] mt-2 font-bold uppercase tracking-wider transition-colors ${isComplete
                        ? "text-foreground"
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
                    <div className="flex-1 mx-3 mt-[-18px]">
                      <div className={`h-[3px] w-full rounded-none transition-all duration-500 ${isComplete ? "bg-foreground" : "bg-foreground/15 border-t-[3px] border-dashed border-foreground/30"}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Status Card ── */}
        <div className="neo-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider">Current Status</h3>
            <div
              className={`neo-badge ${contractState === EscrowState.Unknown
                ? "bg-muted text-muted-foreground"
                : contractState === EscrowState.Pending
                  ? "bg-neo-yellow text-foreground"
                  : contractState === EscrowState.Submitted
                    ? "bg-neo-cyan text-foreground"
                    : "bg-neo-green text-foreground"
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
            <div className="rounded-lg border-3 border-foreground bg-neo-yellow/10 p-3 text-center neo-shadow-sm">
              <p className="text-xl font-bold">100</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold">XLM Locked</p>
            </div>
            <div className="rounded-lg border-3 border-foreground bg-neo-cyan/10 p-3 text-center neo-shadow-sm">
              <p className="text-xl font-bold">2</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold">Parties</p>
            </div>
            <div className="rounded-lg border-3 border-foreground bg-neo-pink/10 p-3 text-center neo-shadow-sm">
              <p className="text-xl font-bold">{currentStep}/3</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold">Steps Done</p>
            </div>
          </div>

          {/* State specific details */}
          <div className="rounded-lg border-3 border-foreground bg-card p-4 flex items-center gap-4">
            {contractState === EscrowState.Unknown && (
              <>
                <div className="h-11 w-11 rounded-lg bg-muted border-3 border-foreground/30 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold">No Active Escrow</p>
                  <p className="text-xs text-muted-foreground font-medium">Initialize an escrow to lock 100 XLM for a freelancer.</p>
                </div>
              </>
            )}
            {contractState === EscrowState.Pending && (
              <>
                <div className="h-11 w-11 rounded-lg bg-neo-yellow/20 border-3 border-foreground flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold">Funds Locked — 100 XLM</p>
                  <p className="text-xs text-muted-foreground font-medium">Waiting for the freelancer to submit proof of work.</p>
                </div>
              </>
            )}
            {contractState === EscrowState.Submitted && (
              <>
                <div className="h-11 w-11 rounded-lg bg-neo-cyan/20 border-3 border-foreground flex items-center justify-center shrink-0">
                  <Hammer className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold">Work Delivered</p>
                  <p className="text-xs text-muted-foreground font-medium">Client can now review and release the funds.</p>
                </div>
              </>
            )}
            {contractState === EscrowState.Released && (
              <>
                <div className="h-11 w-11 rounded-lg bg-neo-green/20 border-3 border-foreground flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold">Escrow Complete</p>
                  <p className="text-xs text-muted-foreground font-medium">Funds have been released to the freelancer.</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Action Card ── */}
        <div className="neo-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Actions</h3>

          {!isConnected ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-lg border-3 border-foreground bg-neo-yellow/15 flex items-center justify-center mx-auto mb-4 neo-shadow-sm">
                <Wallet className="h-8 w-8 text-foreground" />
              </div>
              <p className="text-base font-bold mb-1">Connect Your Wallet</p>
              <p className="text-sm text-muted-foreground mb-5 font-medium">
                Connect a Stellar wallet to interact with the escrow contract.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-7 h-12 rounded-lg bg-neo-yellow text-foreground text-sm font-bold neo-btn"
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
                    <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                      Freelancer Address
                    </label>
                    <input
                      type="text"
                      placeholder="GABCD…"
                      className="w-full h-12 px-4 neo-input text-sm placeholder:text-muted-foreground/50 font-mono"
                      value={freelancerAddr}
                      onChange={(e) => setFreelancerAddr(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={initializeEscrow}
                    disabled={isLoading || !freelancerAddr}
                    className="w-full h-13 rounded-lg bg-neo-yellow text-foreground font-bold text-sm flex items-center justify-center gap-2 neo-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-neo"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
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
                  className="w-full h-13 rounded-lg bg-neo-cyan text-foreground font-bold text-sm flex items-center justify-center gap-2 neo-btn disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
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
                  className="w-full h-13 rounded-lg bg-neo-green text-foreground font-bold text-sm flex items-center justify-center gap-2 neo-btn disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
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
                <div className="text-center py-6">
                  <div className="h-14 w-14 rounded-lg border-3 border-foreground bg-neo-green/20 flex items-center justify-center mx-auto mb-3 neo-shadow-sm">
                    <CheckCircle className="h-7 w-7 text-foreground" />
                  </div>
                  <p className="text-base font-bold">Escrow Complete</p>
                  <p className="text-sm text-muted-foreground font-medium">All funds have been released successfully.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Contract Info Footer ── */}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-muted-foreground font-bold">
          <span className="font-mono px-3 py-1.5 rounded-lg border-2 border-foreground/20 bg-card">
            Contract: {CONTRACT_ID.slice(0, 6)}…{CONTRACT_ID.slice(-4)}
          </span>
          <span className="text-foreground/30">•</span>
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-foreground/20 bg-card hover:border-foreground hover:neo-shadow-sm transition-all duration-100"
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
