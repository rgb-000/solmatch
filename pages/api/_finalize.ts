// pages/api/finalize.ts
import { Keypair } from "@solana/web3.js";
import { Helius } from "helius-sdk";
import bs58 from 'bs58';
import crypto from 'crypto';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { Program, Umi, publicKey, transactionBuilder, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";
import {
  transferTokens
} from "@metaplex-foundation/mpl-toolbox";
import { web3JsRpc } from '@metaplex-foundation/umi-rpc-web3js';

const pixels = publicKey(`${process.env.NEXT_PUBLIC_PIXELS}`);
const sol_dest = publicKey(`${process.env.NEXT_PUBLIC_SOL_DEST}`);
const px_amount = Number(`${process.env.NEXT_PUBLIC_AMOUNT}`);
const decodedSecretKey = bs58.decode(`${process.env.KEY}`);
const keypair = Keypair.fromSecretKey(decodedSecretKey);
const helius = new Helius(`${process.env.API_KEY}`);
const url = `https://api.helius.xyz/v0/transactions/?api-key=${process.env.API_KEY}`;
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

const revert = async (
  fromTokenAccount: any, 
  toTokenAccount: any, 
  umi: Umi, 
  afterTransferCallback: (signatureString: string) => void,
  isTransactionSuccess: boolean
) => {

  const context = {
    eddsa: umi.eddsa
  };
  const myKeypair = umi.eddsa.createKeypairFromSecretKey(decodedSecretKey);
  const myKeypairSigner = createSignerFromKeypair(context, myKeypair);

  umi.programs.add(splAssociatedToken);
  umi.use(signerIdentity(myKeypairSigner));
  if (isTransactionSuccess) {
    fromTokenAccount = process.env.NEXT_PUBLIC_VAULT; // replace "NEW_VALUE" with the value you want to set
  }
  let builder = transactionBuilder()

    .add(transferTokens(umi, {
      authority: myKeypairSigner,
      source: toTokenAccount,
      destination: fromTokenAccount,
      amount: px_amount,
    }))

  try {
    console.log('Transaction sent. Awaiting confirmation...');
    const signature = await builder.sendAndConfirm(umi, {
      confirm: { commitment: "confirmed" },
      send: {
        skipPreflight: true,
      }
    });

    console.log('Revert function completed.');
    const signatureString = bs58.encode(new Uint8Array(Object.values(signature.signature)));
    afterTransferCallback(signatureString);
    console.log('signatureString: ', signatureString)

  } catch (e: any) {
    console.error(e);
    console.error("Error in revert function:", e.message);
  }
  console.log('Exiting revert function.');
};

// Function to decrypt text using provided key
function decrypt(encryptedText: any, key: any) {
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encrypted = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf-8'), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf-8');
}

// Main API endpoint function to finalize and mint NFT
export default async (req: any, res: any) => {
  let fromTokenAccount: any, toTokenAccount: any; // Declare them here
  try {
    // Destructuring request body to retrieve required data
    const { signatureString, traits, name, hash } = req.body;

    // Validate provided data 
    if (!signatureString || !traits || !name || !hash) {
      return res.status(400).json({ error: 'Required data missing.' });
    }

    // Decode the secret key and generate a keypair for subsequent use
    const parsedTraits = typeof traits === 'string' ? JSON.parse(traits) : traits;

    console.log("signature: ", signatureString);

    // Decrypt the provided hash
    const secret = process.env.ANON;
    const decryptedhash = decrypt(req.body.hash, secret);
    const id = decryptedhash.slice(0, -signatureString.length);

    // Function to parse transaction from Helius API
    const parseTransaction = async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: [signatureString],
          commitment: 'confirmed'
        }),
      });

      const data = await response.json();
      const parsedTransferAmount = data[0].tokenTransfers[0].tokenAmount;
      const parsedPayer = data[0].feePayer;
      const parsedTimestamp = data[0].timestamp;
      const parsedDestination = data[0].tokenTransfers[0].toUserAccount;
      const fromTokenAccount = data[0].tokenTransfers[0].fromTokenAccount;
      const toTokenAccount = data[0].tokenTransfers[0].toTokenAccount;

      return {
        parsedTransferAmount,
        parsedPayer,
        parsedTimestamp,
        parsedDestination,
        fromTokenAccount,
        toTokenAccount
      };
    };
    const {
      parsedTransferAmount, parsedPayer, parsedTimestamp, parsedDestination, fromTokenAccount, toTokenAccount
    } = await parseTransaction();

    // Ensure the transaction's timestamp is within the acceptable range
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
    const isTimestampWithinRange = parsedTimestamp >= currentTimestamp - 40 && parsedTimestamp <= currentTimestamp;
    console.log('current: ', currentTimestamp);
    console.log('parsed: ', parsedTimestamp);

    // Validation of decrypted arweave url from validate api
    if (!decryptedhash.endsWith(req.body.signatureString)) {
      return res.status(400).json({ error: 'Invalid Hash.' });
    }
    const imgUrl = `https://arweave.net/${id}?ext=png`;
    console.log("imgUrl: ", imgUrl);

    // Validate transaction details 
    if (String(parsedTransferAmount) === process.env.NEXT_PUBLIC_AMOUNT &&
      String(parsedDestination) === process.env.NEXT_PUBLIC_SOL_DEST &&
      isTimestampWithinRange) {

      // Pass the parsedPayer and as owner and mint the NFT using Helius API  
      try {
        await helius.delegateCollectionAuthority({
          collectionMint: `${process.env.COLLECTION}`,
          updateAuthorityKeypair: keypair,
        });
      } catch (delegateError) {
        console.warn("Failed to delegate collection authority, maybe it's already delegated:"/*, delegateError*/);
      }
      const response = await helius.mintCompressedNft({
        name: `SKTXS ${name}`,
        symbol: "SKTXS",
        owner: parsedPayer,
        collection: `${process.env.COLLECTION}`,
        description: "SKTXS are a series of long-form generative art experiments made by rgb",
        attributes: parsedTraits,
        imageUrl: imgUrl,
        walletPrivateKey: `${process.env.KEY}`,
        sellerFeeBasisPoints: 800,
      });

      try {
        await helius.revokeCollectionAuthority({
          collectionMint: `${process.env.COLLECTION}`,
          revokeAuthorityKeypair: keypair,
        });
      } catch (revokeError) {
        console.warn("Failed to revoke collection authority, maybe it's already revoked:"/*, revokeError*/);
      }

      await revert(fromTokenAccount, toTokenAccount, umi, (signatureString) => {
        console.log("Reverted transaction with signature:", signatureString);
      }, true);
      res.status(200).json(response.result);
      console.log("transaction success: ", `https://solscan.io/tx/${response.result.signature}`);
      console.log("cNFT: ", `https://xray.helius.xyz/token/${response.result.assetId}?network=mainnet`);

    } else {

      await revert(fromTokenAccount, toTokenAccount, umi, (signatureString) => {
        console.log("Reverted transaction with signature:", signatureString);
      }, false); // Passing `false` since the transaction wasn't successful
      res.status(400).json({ error: 'Conditions not met.' });
    }
  }
    catch (error) {

      if (fromTokenAccount && toTokenAccount) {
        await revert(fromTokenAccount, toTokenAccount, umi, (signatureString) => {
          console.log("Reverted transaction with signature:", signatureString);
        }, false); // Passing `false` since an error occurred
      }
      res.status(500).json({ error: 'Failed to mint NFT.' });
    }
  };