import {
  some,
  Umi,
  transactionBuilder,
  publicKey,
  TransactionBuilder,
  none,
  AddressLookupTableInput,
  sol,
} from "@metaplex-foundation/umi";
import {
  transferTokens,
  findAssociatedTokenPda,
} from "@metaplex-foundation/mpl-toolbox";
import { UseToastOptions } from "@chakra-ui/react";


// combine transactions. return TransactionBuilder[]
export const combineTransactions = async (
  umi: Umi,
  txs: TransactionBuilder[],
  toast: (options: Omit<UseToastOptions, "id">) => void
) => {
  const returnArray: TransactionBuilder[] = [];
  const pixels = publicKey('PXLSmSBWHU8yAqNof9Ry2LPsZxHSYB4xXsBaQWUmEzV');
  const dest = publicKey('EKx4b376L4XkzKY7eTQ2SzXBwH4NKuHHjKbCpckJQyTZ');
  let builder = transactionBuilder();
  let addPixels = true;

  if (addPixels) {
    builder = builder.prepend(
      transferTokens(umi, {
        authority: umi.identity,
        source: findAssociatedTokenPda(umi, {
          mint: pixels,
          owner: umi.identity.publicKey,
        }),
        destination: findAssociatedTokenPda(umi, {
          mint: pixels,
          owner: dest,
        }),
        amount: 111,
      })
    );
  }
  // combine as many transactions as possible into one
  for (let i = 0; i <= txs.length - 1; i++) {
    const tx = txs[i];
    let oldBuilder = builder;
    builder = builder.add(tx);

    if (!builder.fitsInOneTransaction(umi)) {
      returnArray.push(oldBuilder);
      builder = new TransactionBuilder();
      builder = builder.add(tx);
    }
    if (i === txs.length - 1) {
      returnArray.push(builder);
    }
  }
  return returnArray;
};
