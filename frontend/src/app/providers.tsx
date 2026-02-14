"use client";

import { ThemeProvider } from "@/context/ThemeProvider";
import { WalletProvider } from "@/context/WalletProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <WalletProvider>{children}</WalletProvider>
        </ThemeProvider>
    );
}
