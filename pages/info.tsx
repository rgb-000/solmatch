// info.tsx
import React, { useState, useEffect, useRef } from 'react';
import styles from "../styles/Home.module.css";
import { Center, useToast, Box } from '@chakra-ui/react';
import { LiaExternalLinkSquareAltSolid } from 'react-icons/lia';
import { LuArrowLeft } from 'react-icons/lu';
import Link from 'next/link';

const PageContent: React.FC = () => {

  return (
    <>
      <Center display={'block'}>
        <Box className="box" />
        <span>Pronounced &apos;sketches&apos;, SKTXS is the inaugural series of long-form generative art by rgb. Utilizing the creative coding capabilities of <a href='https://processing.org/' target="_blank" rel="noopener noreferrer" >Processing<LiaExternalLinkSquareAltSolid display='initial' /></a> through the p5.js interpretation, the collection aims to contribute to the still-emerging long-form generative scene on Solana.</span>
        <Box marginTop={'20px'} />   <span>
        The term &apos;long-form&apos; distinguishes itself from traditional generative art in that the artist doesn&apos;t curate the final results beforehand. Instead, combinations are generated as the user runs the code, making the outcomes inherently unpredictable.</span>
        <Box className="box" />
        <span>
          <Link href='/'><LuArrowLeft /> home</Link>
        </span>
      </Center>

    </>
  );
};

export default function Info() {
  return (
    <main>
      <div className={styles.container}>
        <PageContent
          key="content"
        />
      </div>
    </main>
  );
}