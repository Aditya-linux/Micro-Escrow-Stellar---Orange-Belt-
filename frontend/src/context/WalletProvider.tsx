"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
    isAllowed,
    setAllowed,
    getAddress,
    signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";

export type WalletType = "freighter" | "albedo" | "xbull" | null;

interface WalletContextType {
    address: string;
    walletType: WalletType;
    isConnected: boolean;
    isConnecting: boolean;
    connect: (type: WalletType) => Promise<void>;
    signTransaction: (xdr: string, networkPassphrase: string) => Promise<string>;
    disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error("useWallet must be used within WalletProvider");
    return ctx;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [address, setAddress] = useState("");
    const [walletType, setWalletType] = useState<WalletType>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Auto-reconnect Freighter on page load (it supports isAllowed)
    useEffect(() => {
        const autoConnect = async () => {
            try {
                if (await isAllowed()) {
                    const info = await getAddress();
                    if (info?.address) {
                        setAddress(info.address);
                        setWalletType("freighter");
                    }
                }
            } catch {
                // Freighter not installed or not allowed — ignore
            }
        };
        autoConnect();
    }, []);

    const connectFreighter = async () => {
        await setAllowed();
        const info = await getAddress();
        if (info?.address) {
            setAddress(info.address);
            setWalletType("freighter");
        } else {
            throw new Error("Could not get address from Freighter");
        }
    };

    const connectAlbedo = async () => {
        const albedo = (await import("@albedo-link/intent")).default;
        const result = await albedo.publicKey({});
        if (result.pubkey) {
            setAddress(result.pubkey);
            setWalletType("albedo");
        } else {
            throw new Error("Could not get address from Albedo");
        }
    };

    const connectXBull = async () => {
        const { xBullWalletConnect } = await import(
            "@creit.tech/xbull-wallet-connect"
        );
        const bridge = new xBullWalletConnect();
        try {
            const publicKey = await bridge.connect();
            if (publicKey) {
                setAddress(publicKey);
                setWalletType("xbull");
            } else {
                throw new Error("Could not get address from xBull");
            }
        } finally {
            bridge.closeConnections();
        }
    };

    const connect = useCallback(async (type: WalletType) => {
        if (!type) return;
        setIsConnecting(true);
        try {
            switch (type) {
                case "freighter":
                    await connectFreighter();
                    break;
                case "albedo":
                    await connectAlbedo();
                    break;
                case "xbull":
                    await connectXBull();
                    break;
            }
        } catch (e) {
            console.error(`Failed to connect ${type}:`, e);
            throw e;
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const signTransactionUnified = useCallback(
        async (xdr: string, networkPassphrase: string): Promise<string> => {
            if (!walletType || !address) {
                throw new Error("No wallet connected");
            }

            switch (walletType) {
                case "freighter": {
                    const result = await freighterSignTransaction(xdr, {
                        networkPassphrase,
                        address,
                    });
                    if (result.error) {
                        throw new Error(result.error);
                    }
                    return result.signedTxXdr;
                }

                case "albedo": {
                    const albedo = (await import("@albedo-link/intent")).default;
                    const result = await albedo.tx({
                        xdr,
                        network: networkPassphrase.includes("Test Stellar")
                            ? "testnet"
                            : "public",
                    });
                    return result.signed_envelope_xdr;
                }

                case "xbull": {
                    const { xBullWalletConnect } = await import(
                        "@creit.tech/xbull-wallet-connect"
                    );
                    const bridge = new xBullWalletConnect();
                    try {
                        const signedXdr = await bridge.sign({
                            xdr,
                            publicKey: address,
                            network: networkPassphrase,
                        });
                        return signedXdr;
                    } finally {
                        bridge.closeConnections();
                    }
                }

                default:
                    throw new Error("Unknown wallet type");
            }
        },
        [walletType, address]
    );

    const disconnect = useCallback(() => {
        setAddress("");
        setWalletType(null);
    }, []);

    return (
        <WalletContext.Provider
            value={{
                address,
                walletType,
                isConnected: !!address && !!walletType,
                isConnecting,
                connect,
                signTransaction: signTransactionUnified,
                disconnect,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}
