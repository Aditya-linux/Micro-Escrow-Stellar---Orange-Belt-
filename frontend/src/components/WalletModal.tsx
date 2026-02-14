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
        color: "from-violet-500 to-purple-600",
    },
    {
        type: "albedo",
        name: "Albedo",
        description: "Web-based signing — no extension needed",
        icon: <Globe className="h-6 w-6" />,
        color: "from-blue-500 to-cyan-500",
    },
    {
        type: "xbull",
        name: "xBull",
        description: "Browser extension wallet",
        icon: <Zap className="h-6 w-6" />,
        color: "from-amber-500 to-orange-500",
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
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-sm mx-4 animate-slideUp">
                <div className="rounded-2xl border border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-2">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Connect Wallet
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X className="h-4 w-4 text-slate-500" />
                        </button>
                    </div>

                    <p className="px-6 text-xs text-slate-500 dark:text-slate-400 mb-4">
                        Choose a Stellar wallet to connect
                    </p>

                    {/* Error */}
                    {error && (
                        <div className="mx-6 mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Wallet Options */}
                    <div className="px-6 pb-6 space-y-2">
                        {wallets.map((wallet) => {
                            const isThisConnecting = connectingType === wallet.type;
                            return (
                                <button
                                    key={wallet.type}
                                    onClick={() => handleConnect(wallet.type)}
                                    disabled={isConnecting}
                                    className={`
                    w-full flex items-center gap-4 p-4 rounded-xl
                    border border-slate-200 dark:border-slate-700
                    hover:border-indigo-300 dark:hover:border-indigo-600
                    hover:bg-slate-50 dark:hover:bg-slate-800/70
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    group
                  `}
                                >
                                    {/* Icon */}
                                    <div
                                        className={`
                      flex items-center justify-center h-10 w-10 rounded-lg
                      bg-gradient-to-br ${wallet.color}
                      text-white shadow-md
                      group-hover:scale-110 transition-transform duration-200
                    `}
                                    >
                                        {isThisConnecting ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            wallet.icon
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                                            {wallet.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {isThisConnecting
                                                ? "Connecting..."
                                                : wallet.description}
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    <svg
                                        className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
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
