import React, { useState, useEffect, useRef } from 'react';
import { Box, VStack, Grid, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, useDisclosure, NumberDecrementStepper } from '@chakra-ui/react';
import { useGesture } from 'react-use-gesture';
import { useSpring, animated } from 'react-spring';
import { publicKey } from "@metaplex-foundation/umi";

const url = `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_API_KEY}`;
console.log(url)

interface NFTItem {
  ownership: {
    owner: string;
  };
  content: {
    metadata: {
      name: any;
      attributes: Array<{ trait_type: string; value: string }>;
    };
  };
}

interface NFTOwnership {
  [key: string]: {
    owner: string;
    stiiksCount: number;
    airPodsCount: number;
    airPodsProCount: number;
  };
}

interface MatchCounts {
  [key: string]: number;
}

const match = `╒╤══════╤╕
┢┷━━━━━━┷┪
┃ ▒░▒░▒░ ┃
┃ ░▒░▒░▒ ┃
┃ ▒░▒░▒░ ┃
┃ ░▒░▒░▒ ┃
┗━━━━━━━━┛`;

const matchX = `╒╤══════╤╕
├┴──────┴┤
│  ╲  ╱  │
│   ╲╱	 │
│   ╱╲	 │
│  ╱  ╲	 │
└────────┘`;


const has1 = match.replace('┢┷━━━━━━┷┪', `┢┷━┻━━━━┷┪`);
const has2 = match.replace('┢┷━━━━━━┷┪', `┢┷━┻┻━━━┷┪`);
const has3 = match.replace('┢┷━━━━━━┷┪', `┢┷━┻┻┻━━┷┪`);
const has4 = match.replace('┢┷━━━━━━┷┪', `┢┷━┻┻┻┻━┷┪`);
const has5 = match.replace('┢┷━━━━━━┷┪', `┢┷━┻┻┻┻┻┷┪`);
const has6 = match.replace('┢┷━━━━━━┷┪', `┢┷┻┻┻┻┻┻┷┪`);
const has7 = match.replace('┢┷━━━━━━┷┪', `┢┷┻┻┻┻┻┛+╽`);

async function fetchNFTData(method: string, params: any): Promise<NFTItem[]> {
  let allItems: NFTItem[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: method,
        params: { ...params, page: page, limit: 1000 },
      }),
    });

    const { result } = await response.json();
    allItems = allItems.concat(result.items);


    hasMore = result.items.length === 1000;
    page++;
  }
  return allItems;
}


const PageContent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [ownerData, setOwnerData] = useState({ ownerAddress: '', totalStiiks: 0, totalSolmatches: 0, totalHDI: 0 });
  const [nftOwnership, setNftOwnership] = useState<NFTOwnership>({});
  const [selectedBlockNumber, setSelectedBlockNumber] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<NFTOwnership[keyof NFTOwnership] | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const mapRef = useRef(null);
  const [{ x, y }, set] = useSpring(() => ({ x: 0, y: 0 }));

  useEffect(() => {
    const fetchData = async () => {
      // Fetch data for both collections

      const matches = await fetchNFTData('getAssetsByCreator', {
        creatorAddress: 'HA3UnZT7QHYNLrGA9X9vqBLMT8TgveU67H6aTu8DFHr5',
        onlyVerified: true,
        page: 1, // Starts at 1
        limit: 1000
      });

      const stiiks = await fetchNFTData('getAssetsByGroup', {
        groupKey: 'collection',
        groupValue: 'RmEu5qDmSHyQiPtknFeG3KmHdiyj1BC7E9vubfAMZeA',
        page: 1, // Starts at 1
        limit: 1000
      });

      // Count matches per owner
      const matchCounts: MatchCounts = {};

      matches.forEach((match: NFTItem, index: number) => {
        const ownerAddress = match.ownership.owner;
        if (!matchCounts[ownerAddress]) {
          matchCounts[ownerAddress] = 0;
        }
        matchCounts[ownerAddress]++;
      });

      // Initialize ownership map
      const ownershipMap: NFTOwnership = {};

      matches.forEach((match: NFTItem) => {
        const matchNumber = match.content.metadata.name.match(/\d+/)[0];
        const formattedNumber = matchNumber.toString().padStart(3, '0');
        if (matchNumber) {
          ownershipMap[formattedNumber] = {
            owner: match.ownership.owner,
            stiiksCount: 0, // Initialize stiiks count
            airPodsCount: 0, // Initialize AirPods count
            airPodsProCount: 0 // Initialize AirPodsPro count
          };
        }
      });
      stiiks.forEach(stiik => {
        const ownerAddress = stiik.ownership.owner;
        if (matchCounts[ownerAddress]) {
          let totalStiiks = stiiks.filter(s => s.ownership.owner === ownerAddress).length;
          let matchesForOwner = Object.entries(ownershipMap).filter(([_, ownership]) => ownership.owner === ownerAddress);

          // Distribute at least one stiik to each match (if available)
          matchesForOwner.forEach(([blockNumber, ownership], index) => {
            if (totalStiiks > 0) {
              ownership.stiiksCount = 1;
              totalStiiks--;

              // Check for AirPods or AirPodsPro in stiik's attributes and apply to the current match
              const attributes = stiik.content.metadata.attributes;
              if (attributes && attributes[2] && attributes[2].value) {
                if (attributes[2].value === "AirPods" && index === 0) {
                  ownership.airPodsCount = 1;
                } else if (attributes[2].value === "AirPodsPro" && index === 0) {
                  ownership.airPodsProCount = 1;
                }
              }
            } else {
              ownership.stiiksCount = 0;
            }
          });

          // Distribute remaining stiiks
          while (totalStiiks > 0) {
            for (let i = 0; i < matchesForOwner.length && totalStiiks > 0; i++) {
              let blockNumber = matchesForOwner[i % matchesForOwner.length][0];
              ownershipMap[blockNumber].stiiksCount += 1;
              totalStiiks--;
            }
          }
        }
      });


      setNftOwnership(ownershipMap);
    };


    fetchData();
  }, []);

  const createMatchBox = (index: number) => {
    const blockNumber = (index + 1).toString().padStart(3, '0');
    const ownership = nftOwnership[blockNumber];
    let asciiArt;
    let blockClass = "block";

    if (ownership && ownership.owner) {
      blockClass += " ownedBlock";
      if (ownership.owner === searchQuery) {
        blockClass += " highlightedMatch"; // New class for highlighted matches
      }
      // Determine the ASCII art based on stiiks count
      switch (ownership.stiiksCount) {
        case 1: asciiArt = has1; break;
        case 2: asciiArt = has2; break;
        case 3: asciiArt = has3; break;
        case 4: asciiArt = has4; break;
        case 5: asciiArt = has5; break;
        case 6: asciiArt = has6; break;
        case 0: asciiArt = match; break;
        default: asciiArt = has7; break;

      }
    } else {
      blockClass += " unownedBlock";
      asciiArt = matchX; // ASCII art for blocks with no ownership
    }

    const numberedMatch = asciiArt.replace('▒░▒░▒░', `${blockNumber}░▒░`);

    return (
      <Box key={blockNumber} onClick={() => handleBlockClick(blockNumber)} className={blockClass}>
        <VStack>
          <pre style={{ cursor: "pointer", fontFamily: "var(--font-mono)", whiteSpace: "pre" }}>
            {numberedMatch}
          </pre>
        </VStack>
      </Box>
    );
  };

  // Array of blocks (Match Boxes)

  const bind = useGesture({
    onDrag: ({ offset: [dx, dy] }) => set({ x: dx, y: dy })
  });

  const handleBlockClick = (blockNumber: string) => {
    setSelectedBlock(nftOwnership[blockNumber] || null);
    setSelectedBlockNumber(blockNumber);
    onOpen();
  };


  const blocks = Array.from({ length: 37 * 15 }).map((_, index) => createMatchBox(index));

  const calculateHDI = (stiiksCount: any, airPodsCount: any, airPodsProCount: any) => {
    let multiplier = ((airPodsCount ? 1.5 * airPodsCount : 1) * (airPodsProCount ? 2 * airPodsProCount : 1));
    return stiiksCount > 0 ? <>{Math.round((1000 / stiiksCount) * multiplier)}{airPodsCount ? <> (airpods multiplier)</> : ''}{airPodsProCount ? <> (airpods pro multiplier)</> : ''}</> : 'vacant';
  };

  const handleOwnerClick = (ownerAddress: any) => {
    setSearchQuery(ownerAddress); // Set the owner's name in the search query
    handleOwnerData(ownerAddress); // Trigger handleOwnerData
  };
  const handleOwnerData = (ownerAddress: any) => {
    // Initialize totals
    let totalStiiks = 0;
    let totalSolmatches = 0;
    let totalHDI = 0;

    // Iterate over nftOwnership to calculate totals
    Object.values(nftOwnership).forEach(ownership => {
      if (ownership.owner === ownerAddress) {
        // Add the stiiks count to totalStiiks
        totalStiiks += ownership.stiiksCount;
        console.log(ownership.stiiksCount)
        console.log(ownership.airPodsCount)
        console.log(ownership.airPodsProCount)

        // Increment totalSolmatches for each solmatch
        totalSolmatches += 1;

        // Calculate HDI considering AirPods and AirPods Pro
        let multiplier = ((ownership.airPodsCount ? 1.5 * ownership.airPodsCount : 1) * (ownership.airPodsProCount ? 2 * ownership.airPodsProCount : 1));
        totalHDI += ownership.stiiksCount > 0 ? Math.round((1000 / ownership.stiiksCount) * multiplier) : 0;
      }
    });

    setOwnerData({ ownerAddress, totalStiiks, totalSolmatches, totalHDI });
    setIsOwnerModalOpen(true);
  };

  function shortenAddress(address: any) {
    if (address.length > 10) {
      return address.slice(0, 6) + '...' + address.slice(-4);
    }
    return address;
  }


  return (
    <>
      <div className="search-bar">
        <input
          className="search-bar"
          type="text"
          placeholder="search by owner"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleOwnerData(e.target.value);
          }}
        />
        <Modal isOpen={isOwnerModalOpen} onClose={() => setIsOwnerModalOpen(false)}>
          <ModalBody className='owner'>
            <p>stiiks: {ownerData.totalStiiks}</p>
            <p>solmatchs: {ownerData.totalSolmatches}</p>
            <p>hdi total: {ownerData.totalHDI}</p>
          </ModalBody>
        </Modal>
      </div>

      <div className="map" ref={mapRef} {...bind()} style={{ overflow: 'hidden', touchAction: 'none' }}>
        <animated.div style={{ x, y, touchAction: 'none' }}>
          <Grid templateRows="repeat(15, 1fr)" templateColumns="repeat(37, 1fr)" gap={4}>
            {blocks}
          </Grid>
        </animated.div>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalBody className='details' padding={1}>
            <p>
              {selectedBlock ? (
                <>
                  <h2>solmatch #{selectedBlockNumber}</h2>
                  <p>owner: <button onClick={() => handleOwnerClick(selectedBlock.owner)} style={{ background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}>
  {shortenAddress(selectedBlock.owner)}
</button></p>
                  <p>stiiks: {selectedBlock.stiiksCount}</p>
                  <p>hdi: {calculateHDI(selectedBlock.stiiksCount, selectedBlock.airPodsCount, selectedBlock.airPodsProCount)}</p>
                </>
              ) : (
                <p>burned :(</p>
              )}
            </p>
          </ModalBody>
        </Modal>


      </div></>
  );
};

export default PageContent;