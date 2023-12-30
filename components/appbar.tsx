// ../components/appbar.tsx
import {
  Box,
  Flex,
  HStack,
  Menu,
} from '@chakra-ui/react'
import Link from 'next/link';

import dynamic from 'next/dynamic';
import React from "react";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

interface NavLinkProps {
  children: React.ReactNode;
  href: string;
}

const NavLink: React.FC<NavLinkProps> = ({ children, href }) => {
  return (
    <Link href={href} passHref={true}>
      <Box>
        {children}
      </Box>
    </Link>
  );
}

const Links = () => {
  return (
    <Flex justifyContent="space-between!important" width="95vw">
      <NavLink href='/'>
        <h1>stiiks real state simulator pro</h1>
      </NavLink>
      <HStack spacing={6} display={{ base: 'none', md: 'flex' }}>
      <NavLink href='https://stiiks.xyz/'>
        <h1>stiiks.xyz</h1>
      </NavLink>
        <Link target='_blank' href='https://stiiks.social/'>
          <img src="/social.png" style={{ height: '32px', imageRendering: 'pixelated'}}/>
        </Link>
        <Link href='https://discord.gg/suns-studio'>
          <img src="/discord.png" style={{ height: '30px' }}/>
        </Link>
        <Link target='_blank' href='https://x.com/Stiiks_v2'>
          <img src="/x.png" style={{ height: '30px' }}/>
          </Link>
        <Link target='_blank'  href='https://www.tensor.trade/trade/twitter'>
          <img src="/tensor.png" style={{ height: '30px' }}/>
          </Link>
      </HStack>
    </Flex>
  );
}


export const AppBar: React.FC = () => {

  return (
    <>
      <Box bg={'var(--color-b)'} fontSize={'16px'} px={4} margin={3} minW={'100vw'}>
        <Flex className={'navbar'} h={10} maxH={10} alignItems={'right'} justifyContent={'space-between'}>

          <HStack as={'nav'} spacing={0} display={{ base: 'flex', md: 'flex' }}>
            <Links />
          </HStack>
          <Flex alignItems={'center'}>
            <Menu>
            </Menu>
          </Flex>
        </Flex>
      </Box>
    </>
  );
};
