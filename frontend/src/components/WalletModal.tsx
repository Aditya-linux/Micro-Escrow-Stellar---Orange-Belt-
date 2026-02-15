"use client";

import { useState } from "react";
import { useWallet, WalletType } from "@/context/WalletProvider";
import { Loader2, X, Wallet, Globe, Zap } from "lucide-react";

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const wallets: { type: WalletType; name: string; description: string; icon: React.ReactNode; color: string }[] = [
    {
        type: "freighter",
        name: "Freighter",
        description: "Browser extension wallet",
        icon: <Wallet className="h-6 w-6" />,
        color: "bg-neo-yellow",
    },
    {
        type: "albedo",
        name: "Albedo",
        description: "Web-based signing — no extension needed",
        icon: <Globe className="h-6 w-6" />,
        color: "bg-neo-cyan",
    },
    {
        type: "xbull",
        name: "xBull",
        description: "Browser extension wallet",
        icon: <Zap className="h-6 w-6" />,
        color: "bg-neo-orange",
    },
];

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
    const { connect, isConnecting } = useWallet();
    const [connectingType, setConnectingType] = useState<WalletType>(null);
    const [error, setError] = useState<string>("");

    if (!isOpen) return null;

    const handleConnect = async (type: WalletType) => {
        setConnectingType(type);
        setError("");
        try {
            await connect(type);
            onClose();
        } catch (e) {
            setError(
                e instanceof Error ? e.message : `Failed to connect ${type}`
            );
        } finally {
            setConnectingType(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-foreground/50 animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-sm mx-4 animate-slideUp">
                <div className="rounded-xl border-3 border-foreground bg-card neo-shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-2">
                        <h2 className="text-xl font-bold text-foreground">
                            Connect Wallet
                        </h2>
                        <button
                            onClick={onClose}
                            className="h-8 w-8 rounded-lg border-3 border-foreground bg-card flex items-center justify-center hover:bg-neo-red/15 active:translate-x-[1px] active:translate-y-[1px] transition-all duration-100"
                        >
                            <X className="h-4 w-4 text-foreground" />
                        </button>
                    </div>

                    <p className="px-6 text-xs text-muted-foreground mb-4 font-bold uppercase tracking-wider">
                        Choose a Stellar wallet to connect
                    </p>

                    {/* Error */}
                    {error && (
                        <div className="mx-6 mb-3 p-3 rounded-lg bg-neo-red/10 border-3 border-neo-red">
                            <p className="text-xs text-neo-red font-bold">{error}</p>
                        </div>
                    )}

                    {/* Wallet Options */}
                    <div className="px-6 pb-6 space-y-3">
                        {wallets.map((wallet) => {
                            const isThisConnecting = connectingType === wallet.type;
                            return (
                                <button
                                    key={wallet.type}
                                    onClick={() => handleConnect(wallet.type)}
                                    disabled={isConnecting}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl border-3 border-foreground bg-card hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed group neo-shadow-sm"
                                >
                                    {/* Icon */}
                                    <div
                                        className={`flex items-center justify-center h-11 w-11 rounded-lg border-3 border-foreground ${wallet.color} text-foreground`}
                                    >
                                        {isThisConnecting ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            wallet.icon
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-sm text-foreground">
                                            {wallet.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {isThisConnecting
                                                ? "Connecting..."
                                                : wallet.description}
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    <svg
                                        className="h-5 w-5 text-foreground/40 group-hover:text-foreground transition-colors"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
