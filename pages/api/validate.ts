// pages/api/validate.ts
import multer from 'multer';
import WebIrys from "@irys/sdk";
import crypto from 'crypto';
import sharp from 'sharp';
import bs58 from 'bs58';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { Program, publicKey } from "@metaplex-foundation/umi";
import { web3JsRpc } from '@metaplex-foundation/umi-rpc-web3js';

const umi = createUmi(`${process.env.NEXT_PUBLIC_RPC}`);
umi.use(web3JsRpc(`${process.env.NEXT_PUBLIC_RPC}`));

const splToken: Program = {
  name: "splToken",
  publicKey: publicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
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

// Define max and min sizes for image upload
const max_size = 64 * 1024; // 64kb
<<<<<<< HEAD
const min_size = 5 * 1024; // 5kb
=======
>>>>>>> 3c64e9f5ea7ebb8f76a843ec1317d5256d566c09

// Configure multer for image upload with memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: max_size,
  }
});

async function countUniqueColors(imageBuffer: any) {
  const { data } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });
  const uniqueColors = new Set();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    uniqueColors.add(`${r},${g},${b}`);
  }
  return uniqueColors.size;
}

// Function to initialize and get an instance of the Irys SDK
const getIrys = async () => {
  const privateKey = process.env.KEY;
  const url = "https://node1.irys.xyz";
  const token = "solana";
  const providerUrl = `${process.env.NEXT_PUBLIC_RPC}`; // private RPC URL
  const irys = new WebIrys({ url, token, key: privateKey, config: { providerUrl: providerUrl } });
  await irys.ready();
  return irys;
};

// encrypt signature function (will append the encrypted signature to valide the arweave id)
function encrypt(text: any, key: any) {
  const iv = Buffer.from('0123456789abcdef', 'utf-8');
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'utf-8'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

<<<<<<< HEAD
// Function to decrypt text using provided key
=======
>>>>>>> 3c64e9f5ea7ebb8f76a843ec1317d5256d566c09
function decrypt(encryptedText: any, key: any) {
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encrypted = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf-8'), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf-8');
}

// Configuration for Next.js API route
export const config = {
  api: {
    bodyParser: false,
  },
};

// The main API endpoint to validate and upload images
export default async (req: any, res: any) => {

  let parsedPayer: any;
  let parsedDestination: any;
  let payerTokenAccount: any;
  let authTokenAccount: any;
  let prebalance: any;
  let postbalance: any;

  try {

    umi.programs.add(splToken);

    // Use multer middleware to handle file upload
    upload.single('image')(req, res, async (err) => {

      if (err instanceof multer.MulterError) {
        console.error("Multer error:", err);
        return res.status(500).json({ error: 'Failed to upload image.' });
      } else if (err) {
        console.error("Unknown error during multer upload:", err);
        return res.status(500).json({ error: 'Failed to upload image.' });
      }
      // Check if the image was provided
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'No image provided.' });
      }

      const mint = JSON.parse(`${process.env[`NEXT_PUBLIC_MINT_${req.body.index}`]}`)
      const imageBuffer = req.file.buffer;
      const size = Number(mint.size);
      const max_colors = Number(mint.max_colors);
      const min_colors = Number(mint.min_colors);
      const decryptedHash = decrypt(req.body.canvasHash, process.env.ANON);

<<<<<<< HEAD
      // Generate canvas hash from the imageBuffer

      if (!req.body.pixelDataString) {
        return res.status(400).json({ error: 'No pixelDataString provided.' });
      }

      const pixelDataString = req.body.pixelDataString;
      console.log('pixelDataString:', pixelDataString);
      const canvasHash = crypto.createHash('sha256').update(pixelDataString).digest('hex');
      console.log('canvasHash from pixel data:', canvasHash);

      if (!req.body.imageHash) {
        return res.status(400).json({ error: 'No encrypted hash provided.' });
      }

      const decryptedHash = decrypt(req.body.imageHash, process.env.ANON);
      console.log('decryptedHash :', decryptedHash)

      // Compare the decrypted hash with the actual image hash, and if they don't match, return an error
      if (canvasHash !== decryptedHash) {
        return res.status(400).json({ error: 'Hash mismatch. Validation failed.' });
      }

      // Function to handle image upload to Irys
      const uploadImage = async () => {
        const irys = await getIrys();
        const price = await irys.getPrice(48000);
        await irys.fund(price);

        try {
          const response = await irys.upload(imageBuffer);
          const k = process.env.ANON;
          const a = `${response.id}${req.body.signatureString}`;
          const b = encrypt(a, k);
          return `${b}`;
        } catch (e) {
          console.error("Error uploading file:", e);
          throw e;
        }
      };
      // Try uploading the image and send the response hash
      try {
        const hash = await uploadImage();
        res.status(200).json({ hash: hash });
      } catch (uploadError) {
        console.error("Error uploading to Irys:", uploadError);
        res.status(500).json({ error: 'Failed to validate.' });
      }
    });
=======
      console.log('decrypted hash :', decryptedHash)

      sharp(imageBuffer)
        .resize(size, size, { kernel: sharp.kernel.nearest })
        .toBuffer()
        .then(async resizedBuffer => {

          // Count unique colors
          const numberOfUniqueColors = await countUniqueColors(resizedBuffer);

          // Check if the image has only less than 2 colors
          if (numberOfUniqueColors < min_colors) {
            return res.status(400).json({ error: 'Image consists of only one color.' });
          }

          // Check if the image has only one color
          if (numberOfUniqueColors > max_colors) {
            return res.status(400).json({ error: 'Image consists of only one color.' });
          }

          // Use resizedBuffer for operations that were using imageBuffer
          const pixelData = resizedBuffer;
          const hash = crypto.createHash('sha256').update(pixelData).digest('hex');
          console.log('buffer hash', hash);

          // Compare the decrypted hash with the actual image hash, and if they don't match, return an error
          if (hash !== decryptedHash) {
            return res.status(400).json({ error: 'Hash mismatch. Validation failed!' });
          }

          const uploadImage = async () => {
            const irys = await getIrys();
            const price = await irys.getPrice(48000);
            await irys.fund(price);

            try {
              // Use resizedBuffer instead of imageBuffer
              const response = await irys.upload(resizedBuffer);
              const k = process.env.ANON;
              const a = `${response.id}:${parsedTransferAmount}:${parsedPayer}:${payerTokenAccount}:${authTokenAccount}:${req.body.signatureString}`;
              const b = encrypt(a, k);
              return `${b}`;
            } catch (e) {
              console.error("Error uploading file:", e);
              throw e;
            }
          };

          // Function to parse transaction from Helius API
          const decodedTxid = bs58.decode(req.body.signatureString);

          const parseTransaction = async () => {
            // Call the getTransaction method and expect it to return an object, not a Response.
            const transactionWithMeta = await umi.rpc.getTransaction(decodedTxid, { commitment: 'confirmed' as const });

            // Directly return the relevant properties from the transactionWithMeta object.
            return {
              parsedPayer: transactionWithMeta?.message.accounts[0],
              payerTokenAccount: transactionWithMeta?.message.accounts[1],
              parsedDestination: transactionWithMeta?.message.accounts[3],
              authTokenAccount: transactionWithMeta?.message.accounts[2],
              prebalance: transactionWithMeta?.meta.preTokenBalances[0].amount.basisPoints.toString(),
              postbalance: transactionWithMeta?.meta.postTokenBalances[0].amount.basisPoints.toString(),
            };
          };

          try {
            ({
              parsedPayer,
              payerTokenAccount,
              parsedDestination,
              authTokenAccount,
              prebalance,
              postbalance,
            } = await parseTransaction());
          } catch (error) {
          }

          const parsedTransferAmount = Number(prebalance) - Number(postbalance)
          const finalized_slot = await umi.rpc.getSlot({ commitment: 'finalized' as const });
          const getSignatureStatuses = await umi.rpc.getSignatureStatuses([decodedTxid]);
          const tx_slot = Number(getSignatureStatuses[0]?.slot);

          if (String(parsedTransferAmount) !== process.env.NEXT_PUBLIC_AMOUNT) {
            return res.status(400).json({ error: `Transaction amount does not match the mint price.` });
          }

          if (String(parsedDestination) !== process.env.NEXT_PUBLIC_DEST) {
            return res.status(400).json({ error: `Destination does not match the expected destination.` });
          }

          if (BigInt(tx_slot) <= BigInt(finalized_slot)) {
            return res.status(400).json({ error: "Transaction slot is not greater than the last finalized slot." });
          }

          try {
            const hash = await uploadImage();
            res.status(200).json({ hash: hash });
          } catch (uploadError) {
            console.error("Error uploading to Irys:", uploadError);
            res.status(500).json({ error: 'Failed to validate.' });
          }

        })

        .catch(err => {
          console.error(err);
        });

    })
>>>>>>> 3c64e9f5ea7ebb8f76a843ec1317d5256d566c09
  } catch (error) {
    console.error("General error in upload API:", error);
    res.status(500).json({ error: 'Failed to handle the request.' });
  }
};