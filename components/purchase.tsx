// purchase.tsx
import { Button, UseToastOptions } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Umi, publicKey, transactionBuilder, sol } from "@metaplex-foundation/umi";
import {
    transferTokens,
    findAssociatedTokenPda,
    transferSol
} from "@metaplex-foundation/mpl-toolbox"; import React from "react";
import bs58 from "bs58";

const txPixels = (umi: Umi, toast: (options: Omit<UseToastOptions, "id">) => void, afterTransferCallback: (signatureString: string) => void) => async () => {
    const pixels = publicKey(`${process.env.NEXT_PUBLIC_PIXELS}`);
    const dest = publicKey(`${process.env.NEXT_PUBLIC_DEST}`);
    const px_amount = Number(`${process.env.NEXT_PUBLIC_AMOUNT}`);

    let builder = transactionBuilder()

        .add(transferTokens(umi, {
            authority: umi.identity,
            source: findAssociatedTokenPda(umi, {
                mint: pixels,
                owner: umi.identity.publicKey,
            }),
            destination: findAssociatedTokenPda(umi, {
                mint: pixels,
                owner: dest,
            }),
            amount: px_amount,
        }))
        .add(transferSol(umi, {
            destination: dest,
            amount: sol(Number(0.001)),
        }))

    try {
        const signature = await builder.sendAndConfirm(umi, {
            confirm: { commitment: "confirmed" },
            send: {
                skipPreflight: true,
            }
        });

        const signatureString = bs58.encode(new Uint8Array(Object.values(signature.signature)));
        afterTransferCallback(signatureString); // Pass the signature to the callback

        toast({
            title: "1/3 processing transaction...",
            description: `don't close this window`,
            status: "loading",
            duration: 6000,
            isClosable: true,
        });

    } catch (e) {
        console.error(e);
    }
}
type Props = {
    umi: Umi;
    toast: (options: Omit<UseToastOptions, "id">) => void;
    mintNFT: (signatureString: string, onError: () => void) => Promise<void>;
    IsDisableMint: boolean;
    setIsDisableMint: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Purchase = ({ umi, toast, mintNFT, IsDisableMint, setIsDisableMint }: Props) => {
    const [recentSlot, setRecentSlot] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const handlePixelClick = async () => {
        setIsLoading(true);
        await txPixels(umi, toast, async (signatureString) => {
            await mintNFT(signatureString, () => {
                setIsDisableMint(false); // Reset on error
            });
        })();
        setIsLoading(false);
        setIsDisableMint(true);
    };

    useEffect(() => {
        console.log("IsDisableMint:", IsDisableMint);
    }, [IsDisableMint]);

    useEffect(() => {
        (async () => {
            setRecentSlot(await umi.rpc.getSlot())
        })();
    }, [umi]);

    return (
        <>
            <Button size={'xs'} fontSize={'20px'} onClick={handlePixelClick} isLoading={isLoading} isDisabled={isLoading || IsDisableMint}>
                {isLoading ? "Wait" : "MINT"}
            </Button>
        </>
    );
}
