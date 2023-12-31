import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useMemo } from "react";
import { UmiProvider } from "../utils/UmiProvider";
import "@/styles/globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { ChakraProvider } from '@chakra-ui/react'
import { AppBar } from "@/components/appbar";

export default function App({ Component, pageProps }: AppProps) {
  let network = WalletAdapterNetwork.Mainnet;
  let endpoint = process.env.NEXT_PUBLIC_RPC || '';

  const wallets = useMemo(
    () => [
        new SolflareWalletAdapter(),
    ],
    [network]
);
  return (
    <>
       <style jsx global>
          {`
      html, body, main {
          background: var(--color-b); 
       }
   `}
        </style>
      <ChakraProvider>
        <WalletProvider wallets={wallets}>
          <UmiProvider endpoint={endpoint}>
            <WalletModalProvider>
               < AppBar />
                <Component {...pageProps} />
            </WalletModalProvider>
          </UmiProvider>
        </WalletProvider>
      </ChakraProvider>
    </>
  );
}
