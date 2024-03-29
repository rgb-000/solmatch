import React, { useState, useEffect, useRef } from 'react';
import { Box, VStack, Grid, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, useDisclosure, NumberDecrementStepper } from '@chakra-ui/react';
import { useGesture } from 'react-use-gesture';
import { useSpring, animated } from 'react-spring';

const url = `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_API_KEY}`;

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
    multiplier?: number;
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
  const [ownerData, setOwnerData] = useState({ ownerAddress: '', totalStiiks: 0, totalSolmatches: 0, totalHDI: 0, hdiExpression: '', });
  const [nftOwnership, setNftOwnership] = useState<NFTOwnership>({});
  const [selectedBlockNumber, setSelectedBlockNumber] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<NFTOwnership[keyof NFTOwnership] | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const mapRef = useRef(null);
  const [{ x, y }, set] = useSpring(() => ({ x: 0, y: 0 }));

  const applyMultiplierToAdjacentBlocks = (ownershipMap: any) => {
    const gridRows = 15;
    const gridCols = 37;

    const getBlockNumber = (row: any, col: any) => {
      return (row * gridCols + col + 1).toString().padStart(3, '0');
    };

    const applyMultiplier = (row: any, col: any) => {
      const blockNumber = getBlockNumber(row, col);
      if (ownershipMap[blockNumber] && ownershipMap[blockNumber].owner) {
        ownershipMap[blockNumber].multiplier = (ownershipMap[blockNumber].multiplier || 1) * 0.9;
      }
    };

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const blockNumber = getBlockNumber(row, col);
        if (!ownershipMap[blockNumber] || !ownershipMap[blockNumber].owner) {
          // Check and apply multiplier to adjacent blocks
          if (row > 0) applyMultiplier(row - 1, col); // up
          if (row < gridRows - 1) applyMultiplier(row + 1, col); // down
          if (col > 0) applyMultiplier(row, col - 1); // left
          if (col < gridCols - 1) applyMultiplier(row, col + 1); // right
        }
      }
    }

    console.log("Ownership map after applying multipliers:", ownershipMap);
  };

  useEffect(() => {

  }, []);



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

      // Adjusted typing for airPodsCounts
      interface AirPodsCounts {
        [ownerAddress: string]: number;
      }

      const airPodsCounts: AirPodsCounts = {};

      stiiks.forEach(stiik => {
        const ownerAddress = stiik.ownership.owner;
        const attributes = stiik.content.metadata.attributes;
        if (attributes && attributes[2]) {
          const attributeValue = attributes[2].value;
          if (attributeValue === "AirPods" || attributeValue === "AirPodsPro") {
            if (!airPodsCounts[ownerAddress]) {
              airPodsCounts[ownerAddress] = 0;
            }
            airPodsCounts[ownerAddress] += 1;
          }
        }
      });
      
      // Initialize and distribute both stiiks and AirPods
        stiiks.forEach(stiik => {
      const ownerAddress = stiik.ownership.owner;
      if (matchCounts[ownerAddress]) {
        let totalStiiks = stiiks.filter(s => s.ownership.owner === ownerAddress).length;
        let totalAirPods = airPodsCounts[ownerAddress] || 0;
        let matchesForOwner = Object.entries(ownershipMap).filter(([_, ownership]) => ownership.owner === ownerAddress);

        matchesForOwner.forEach(([blockNumber, ownership]) => {
          // Distribute stiiks
          if (totalStiiks > 0) {
            ownership.stiiksCount = 1;
            totalStiiks--;
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

        // Distribute AirPods
        matchesForOwner.forEach(([blockNumber, ownership]) => {
          if (totalAirPods > 0) {
            ownership.airPodsCount = 1;
            totalAirPods--;
          } else {
            ownership.airPodsCount = 0;
          }
        });
      }
    });

    applyMultiplierToAdjacentBlocks(ownershipMap);
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

  const calculateHDI = (stiiksCount: any, airPodsCount: any, airPodsProCount: any, multiplier: any) => {
    console.log(`Calculating HDI: stiiksCount=${stiiksCount}, airPodsCount=${airPodsCount}, airPodsProCount=${airPodsProCount}, multiplier=${multiplier}`);

    const baseMultiplier = ((airPodsCount ? 1.5 * airPodsCount : 1) * (airPodsProCount ? 2 * airPodsProCount : 1));
    let totalMultiplier = baseMultiplier * (multiplier || 1); // Apply adjacent block multiplier if available

    // Apply coupleMultiplier if stiiksCount is 2
    let coupleMultiplier = 1;
    let coupleText = '';
    if (stiiksCount === 2) {
      coupleMultiplier = 1;
      coupleText = '';
    }

    totalMultiplier *= coupleMultiplier;

    return stiiksCount > 0 ? (
      <>
        {Math.round((1000 / stiiksCount * (stiiksCount > 1 ? 2 : 1)) * totalMultiplier)}
        {airPodsCount ? <> (airpods: x 2)</> : ''}
        {airPodsProCount ? <> (: x 2)</> : ''}
        {multiplier ? <> (surroundings: x {multiplier.toFixed(1)})</> : ''}
        {coupleText}
      </>
    ) : 'no data (vacant)';
  };


  const handleOwnerClick = (ownerAddress: any) => {
    setSearchQuery(ownerAddress); // Set the owner's name in the search query
    handleOwnerData(ownerAddress); // Trigger handleOwnerData
  };
  const handleOwnerData = (ownerAddress: any) => {
    let totalStiiks = 0;
    let totalSolmatches = 0;
    let totalHDI = 0;
    let hdiExpression = '';

    Object.values(nftOwnership).forEach(ownership => {
      if (ownership.owner === ownerAddress) {
        totalStiiks += ownership.stiiksCount;
        totalSolmatches += 1;
        let multiplier = ((ownership.airPodsCount ? 1.5 * ownership.airPodsCount : 1) * (ownership.airPodsProCount ? 2 * ownership.airPodsProCount : 1) * (ownership.multiplier ? ownership.multiplier : 1));
        totalHDI += ownership.stiiksCount > 0 ? Math.round((1000 / ownership.stiiksCount) * multiplier) : 0;
      }
    });

    if (totalHDI < 1) {
      hdiExpression = '｡•́︿•̀｡';
    } else if (totalHDI > 1 && totalHDI <= 300) {
      hdiExpression = 'simple';
    } else if (totalHDI > 300 && totalHDI <= 800) {
      hdiExpression = 'so simple';
    } else if (totalHDI > 800 && totalHDI <= 1600) {
      hdiExpression = 'super simple';
    } else if (totalHDI > 1600 && totalHDI <= 3000) {
      hdiExpression = 'pleasantly simple';
    } else if (totalHDI > 3000 && totalHDI <= 5000) {
      hdiExpression = 'good as gold, simple as pie';
    } else if (totalHDI > 5000 && totalHDI <= 7500) {
      hdiExpression = 'shining simple, stunning good';
    } else if (totalHDI > 7500 && totalHDI <= 10000) {
      hdiExpression = 'fantastically good, wonderfully simple';
    } else if (totalHDI > 10000 && totalHDI <= 13000) {
      hdiExpression = 'goodness galore, simplicity supreme';
    } else if (totalHDI > 13000) {
      hdiExpression = 'simply the best, better than all the rest';
    }

    setOwnerData({ ownerAddress, totalStiiks, totalSolmatches, totalHDI, hdiExpression });
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
            <p>properties: {ownerData.totalSolmatches}</p>
            <p>hdi total: {ownerData.totalHDI} ({ownerData.hdiExpression})</p>
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
                  <p>hdi: {calculateHDI(selectedBlock.stiiksCount, selectedBlock.airPodsCount, selectedBlock.airPodsProCount, selectedBlock.multiplier)} </p>


                </>
              ) : (<>burned properties decrease the surrounding hdi (｡•́︿•̀｡)</>
              )}
            </p>
          </ModalBody>
        </Modal>


      </div></>
  );
};

export default PageContent;