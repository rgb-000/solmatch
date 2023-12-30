// pages/api/finalize.ts
import { Keypair } from "@solana/web3.js";
import { Helius } from "helius-sdk";
import bs58 from 'bs58';
import crypto from 'crypto';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { Program, Umi, publicKey, transactionBuilder, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";
import { transferTokens } from "@metaplex-foundation/mpl-toolbox";
import { web3JsRpc } from '@metaplex-foundation/umi-rpc-web3js';
import { createClient } from '@vercel/kv';

const kv = createClient({
  url: `${process.env.KV_REST_API_URL}`,
  token: `${process.env.KV_REST_API_TOKEN}`,
});

// Configuration constants
const helius = new Helius(`${process.env.API_KEY}`);
const decodedSecretKey = bs58.decode(`${process.env.KEY}`);

// Token transfer configs to make refunds or transfer to vault
const umi = createUmi(`${process.env.NEXT_PUBLIC_RPC}`);
umi.use(web3JsRpc(`${process.env.NEXT_PUBLIC_RPC}`));

const splAssociatedToken: Program = {
  name: "splAssociatedToken",
  publicKey: publicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
  getErrorFromCode: () => {
    return null;
  },
  getErrorFromName: () => {
    return null;
  },
  isOnCluster: () => {
    return true;
  }
};

const transfer = async (
  authTokenAccount: any,
  toTokenAccount: any,
  amount: any,
  umi: Umi
): Promise<string | null> => {

  const context = {
    eddsa: umi.eddsa
  };
  const myKeypair = umi.eddsa.createKeypairFromSecretKey(decodedSecretKey);
  const myKeypairSigner = createSignerFromKeypair(context, myKeypair);

  umi.programs.add(splAssociatedToken);
  umi.use(signerIdentity(myKeypairSigner));

  let builder = transactionBuilder()

    .add(transferTokens(umi, {
      authority: myKeypairSigner,
      source: authTokenAccount,
      destination: toTokenAccount,
      amount: Number(amount)
    }))

  try {
    const signature = await builder.sendAndConfirm(umi, {
      confirm: { commitment: "confirmed" },
      send: { skipPreflight: true }
    });
    const signatureString = bs58.encode(new Uint8Array(Object.values(signature.signature)));
    return signatureString; // Return the signature upon successful transfer
  } catch (e: any) {
    console.error("error in transfer function:", e.message);
    return null;  // Return null if an error occurred
  }
};

const handleTransfer = async (
  authTokenAccount: any,
  toTokenAccount: any,
  amount: any,
  umi: Umi
): Promise<string | null> => {  // Notice the return type is now Promise<string | null>
  try {
    const transferSignature = await transfer(
      authTokenAccount,
      toTokenAccount,
      amount,
      umi
    );
    if (transferSignature) {
      console.log("--------------------");
      console.log(`sent ${amount} pixels: `, `https://solscan.io/tx/${transferSignature}`);
      return transferSignature;
    } else {
      console.warn('failed to transfer pixels.');
      return null;
    }
  } catch (error) {
    console.error('failed to process transfer:', error);
    return null;
  }
};

// Function to decrypt text using provided key and extract variables
function decryptAndExtractVariables(encryptedText: any, key: any) {
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encrypted = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf-8'), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  const [responseId, parsedTransferAmount, parsedPayer, payerTokenAccount, authTokenAccount, signature] = decrypted.toString('utf-8').split(':');
  return {
    responseId,
    parsedTransferAmount,
    parsedPayer,
    payerTokenAccount,
    authTokenAccount,
    signature
  };
}

export default async (req: any, res: any) => {
  let parsedTransferAmount: any;
  let parsedPayer: any;
  let payerTokenAccount: any;
  let authTokenAccount: any;
  let id: any;
  let signature: any;

  try {
    const { signatureString, traits, hash, index } = req.body;
    umi.programs.add(splAssociatedToken);

    if (!signatureString || !traits || !hash || !index) {
      return res.status(400).json({ error: 'Required data missing.' });
    }
    // Decode the secret key and decrypt the provided hash
    const keypair = Keypair.fromSecretKey(decodedSecretKey);
    const parsedTraits = typeof traits === 'string' ? JSON.parse(traits) : traits;
    const secret = process.env.ANON;
    const decryptedVariables = decryptAndExtractVariables(req.body.hash, secret);

    // Use the extracted variables as needed
    parsedTransferAmount = Number(decryptedVariables.parsedTransferAmount);
    parsedPayer = decryptedVariables.parsedPayer;
    payerTokenAccount = decryptedVariables.payerTokenAccount;
    authTokenAccount = decryptedVariables.authTokenAccount;
    id = decryptedVariables.responseId;
    signature = decryptedVariables.signature;

    const imgUrl = `https://arweave.net/${id}?ext=png`;
    console.log("image url: ", imgUrl);
    console.log("collection index: ", index);

    if (String(signature) !== signatureString) {
      return res.status(400).json({ error: `Destination does not match the expected destination.` });
    }
    const lastIndex = Number(await kv.get(`index_${index}`) || 0);
    const newIndex = lastIndex + 1;
    await kv.set(`index_${index}`, newIndex);

    try {
      await helius.delegateCollectionAuthority({
        collectionMint: `${process.env[`COLLECTION_${index}`]}`,
        updateAuthorityKeypair: keypair,
      });
    } catch (delegateError) {
      console.warn("Failed to delegate collection authority, maybe it's already delegated:"/*, delegateError*/);
    }

    let name;
    if (index === 'I') {
      name = `#`;
    } else if (index === 'II') {
      name = `II #`;
    } else {
      name = `#`;
    }

    try {
      const response = await helius.mintCompressedNft({
        name: `SKTXS ${name}${newIndex}`,
        symbol: "SKTXS",
        owner: parsedPayer,
        collection: `${process.env[`COLLECTION_${index}`]}`,
        description: "SKTXS is the inaugural long-form generative art collection by @rgb0x00",
        attributes: parsedTraits,
        imageUrl: imgUrl,
        walletPrivateKey: `${process.env.KEY}`,
        sellerFeeBasisPoints: 800,
        creators: [{ "address": parsedPayer, "share": 50 },
        { "address": "rgbxqdf7E3WJEwPHBnuwtDkgQ9AEghMYMC2pYdDxnkt", "share": 50 }]
      });

      try {
        await helius.revokeCollectionAuthority({
          collectionMint: `${process.env[`COLLECTION_${index}`]}`,
          revokeAuthorityKeypair: keypair,
        });
      } catch (revokeError) {
        console.warn("Failed to revoke collection authority, maybe it's already revoked:"/*, revokeError*/);
      }
      await handleTransfer(authTokenAccount, process.env.TOKEN_ACC, parsedTransferAmount, umi);
      res.status(200).json(response.result);
      console.log("--------------------");
      console.log(`#${newIndex} tx: `, `https://solscan.io/tx/${response.result.signature}`);
      console.log("--------------------");
      console.log("cNFT: ", `https://xray.helius.xyz/token/${response.result.assetId}?network=mainnet`);

    } catch (error) {
      const failedTransferSignature = await handleTransfer(authTokenAccount, payerTokenAccount, parsedTransferAmount, umi);
      await kv.set(`index_${index}`, lastIndex);
      console.log("--------------------");
      console.log(`#${newIndex} failed back to #${lastIndex}`);
      res.status(500).json({ transferSignature: failedTransferSignature });
    }
  }

  catch (error) {
    const failedTransferSignature = await handleTransfer(authTokenAccount, payerTokenAccount, parsedTransferAmount, umi);
    res.status(500).json({ transferSignature: failedTransferSignature });
  }
};
