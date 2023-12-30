// ../components/pixelgrid.tsx
import React, { useRef, useEffect, useState } from 'react';
import p5 from 'p5';
import { Center, HStack, Box, VStack, Stack } from '@chakra-ui/react';
import { LuRepeat2 } from 'react-icons/lu';


import styles from 'styles/Home.module.css';
const palettes = [
    { name: "plastic boots", colors: ["#c5f1c3", "#5bb8a9", "#1f606f", "#2d1c01"] },
    { name: "desert snake", colors: ["#885054", "#fff0d7", "#2c071f", "#d9c86f"] },
    { name: "poliester", colors: ["#4b2581", "#061f3a", "#c53b9e", "#ff8f81"] },
    { name: "clavichord", colors: ["#01303c", "#ff7878", "#ffcf97", "#f2f3db"] },
    { name: "soda can", colors: ["#11081b", "#79a8f6", "#fce29c", "#e3f4e5"] },
    { name: "pitfall", colors: ["#d1d059", "#a1a941", "#718029", "#415011"] },
    { name: "wood bench", colors: ["#220c1c", "#4e232d", "#9e664d", "#cfac52"] },
    { name: "autumn portrait", colors: ["#f0fad7", "#bb5145", "#7b1d4c", "#1c0427"] },
    { name: "iron forge", colors: ["#7f2024", "#c51920", "#130a1a", "#5f416a"] },
    { name: "silk dojo", colors: ["#e02040", "#fff9ee", "#7c6a61", "#281e2d"] },
    { name: "park ticket", colors: ["#2277cd", "#2277cd", "#fba7ad", "#e9e8cc"] },
    { name: "galactic shore", colors: ["#312488", "#ff38a7", "#01fbad", "#fffeaf"] },
    { name: "barbershop", colors: ["#a5939b", "#e5dcbc", "#503b55", "#271e1d"] },
    { name: "fish sauce", colors: ["#fffffe", "#f52f20", "#30256c", "#070709"] },
    { name: "cga hard", colors: ["#000000", "#55ff55", "#ff5555", "#ffff55"] },
    { name: "neon demon", colors: ["#000000", "#000010", "#000030", "#000099"] },
]

function getRandomPalette() {
    return p5.prototype.random(palettes);
}

function randomizeColors(setPaletteName: React.Dispatch<React.SetStateAction<string>>) {
    const palette = getRandomPalette();
    setPaletteName(palette.name);
    return palette.colors;
}

interface PixelGridProps {
    id: string;
    IsDisableMint: boolean;
    setIsDisableMint: React.Dispatch<React.SetStateAction<boolean>>;
    onCanvasHashUpdate: (hash: string) => void;  // Function that takes a string and returns void
}

const PixelGrid: React.FC<PixelGridProps> = ({ id, IsDisableMint, setIsDisableMint, onCanvasHashUpdate
}) => {
    const canvasRef = useRef(null);
    const [renderedColorsCount, setRenderedColorsCount] = useState<{ [color: string]: number }>({});
    const [myP5, setMyP5] = useState<p5 | null>(null);
    const [colorsAndPalette, setColorsAndPalette] = useState(() => {
        const palette = getRandomPalette();
        return { colors: palette.colors, paletteName: palette.name };
    });
    const [colors, setColors] = useState<string[]>(colorsAndPalette.colors);
    const [paletteName, setPaletteName] = useState<string>(colorsAndPalette.paletteName);
    const [numOfRenderedColors, setNumOfRenderedColors] = useState(0);
    const [canvasHash, setCanvasHash] = useState<string>('');

    function countRenderedColors(p: p5) {
        const colorsCount: { [color: string]: number } = {};
        p.loadPixels();

        for (let i = 0; i < p.pixels.length; i += 4) {
            // Construct the color string
            const colorStr = `#${((1 << 24) + (p.pixels[i] << 16) + (p.pixels[i + 1] << 8) + p.pixels[i + 2]).toString(16).slice(1)}`;

            // Count the color occurrences
            if (colorsCount[colorStr]) {
                colorsCount[colorStr]++;
            } else {
                colorsCount[colorStr] = 1;
            }
        }

        return colorsCount;
    }

    const sketch = (p: p5) => {
        let canvasWidth: number;
        let canvasHeight: number;

        p.setup = () => {
            // Setup for the responsive canvas
            if (p.windowWidth < 480) {
                canvasWidth = 360;
            } else {
                canvasWidth = 480;
            }
            canvasHeight = canvasWidth; // Assuming canvas width and height are the same

            let canvas = p.createCanvas(canvasWidth, canvasHeight);
            let canvasElem = canvas.elt as HTMLCanvasElement;
            canvasElem.getContext('2d', { willReadFrequently: true });
            p.noSmooth();
            p.noStroke();
            p.angleMode(p.DEGREES);
            generatePattern();
        };

        async function generatePattern() {
            let newColors = randomizeColors(setPaletteName);
            setColors(newColors);  // Set the colors state here
            p.fill(newColors[p.int(p.random(4))]); // set the background to the last color in the palette
            p.noStroke();
            p.strokeWeight(0);

            let c = 1;
            let w = Math.floor(canvasWidth / 1);
            for (let i = 0; i < c; i++) {
                for (let j = 0; j < c; j++) {
                    let x = i * w + w / 2;
                    let y = j * w + w / 2;
                    p.fill(newColors[p.int(p.random(4))]); // Just use the color directly, no shuffling
                    p.noStroke();
                    p.rect(x - w / 2, y - w / 2, w, w);
                    gen(x, y, w * 0.80, newColors);  // pass the newColors here
                }
            }
            p.loadPixels();
            const colorsCount = countRenderedColors(p);
            setRenderedColorsCount(colorsCount);
            const uniqueColorsRendered = Object.keys(colorsCount).length;
            setNumOfRenderedColors(uniqueColorsRendered);

            const mint = JSON.parse(`${process.env.NEXT_PUBLIC_MINT_I}`);
            const size = mint.size
            const response = await fetch('/api/sethash', {
                method: 'POST',
                body: JSON.stringify({ imageData: (p as any).canvas.toDataURL(), size: size }),
                headers: { 'Content-Type': 'application/json' }
            });

            const { canvasHash } = await response.json();
            if (canvasHash) {
                setCanvasHash(canvasHash);
                onCanvasHashUpdate(canvasHash);
            }
            
        }

        function gen(x: number, y: number, w: number, colorsToUse: string[]) {
            let c = 4;
            let grid: number[][] = [];
            let ww = (w / 2) / c;

            for (let i = 0; i < c; i++) {
                let arr = [];
                for (let j = 0; j < c; j++) {
                    arr[j] = p.int(p.random(4)); // Ensuring we capture all colors including the 4th
                }
                grid[i] = arr;
            }

            p.push();
            p.translate(x - w / 2, y - w / 2);
            for (let i = 0; i < c; i++) {
                for (let j = 0; j < c; j++) {
                    let x = i * ww;
                    let y = j * ww;
                    let num = grid[i][j];
                    if (num) {
                        const currentColor = colorsToUse[num];
                        p.fill(currentColor);
                        p.rect(x, y, ww, ww);
                        p.rect(w - x - ww, y, ww, ww); // horizontal mirror
                        p.rect(x, w - y - ww, ww, ww); // vertical mirror
                        p.rect(w - x - ww, w - y - ww, ww, ww); // horizontal & vertical mirror
                    }
                }
            }
            p.pop();

        }


    };

    useEffect(() => {
        if (canvasRef.current) {
            const instance = new p5(sketch, canvasRef.current);
            setMyP5(instance);
            return () => instance.remove();
        }
    }, [canvasRef]);




    return (
        <>

            <Center>
                <HStack gap={'20px'} >

                    <LuRepeat2 pointerEvents={'initial'} className='reload' onClick={() => {
                        if (myP5) {
                            myP5.remove();
                        }

                        if (canvasRef.current) {
                            setMyP5(new p5(sketch, canvasRef.current));
                        }

                        setIsDisableMint(false);
                    }} />

                </HStack></Center>

            <Box className="box" />
            <div id={'rgb'} className={styles.rgb} ref={canvasRef}>
            </div>
            <Box className="box" />
            <Center>
                <HStack gap={'10px'} fontSize={'xs'} alignItems={'center'}>

                    <HStack gap={'20px'} id={'attributes'} fontSize={'xs'}>
                        <span>palette: {paletteName}</span>
                        <span>colors: {numOfRenderedColors}</span>
                    </HStack>
                    {Object.keys(renderedColorsCount).map((color, index) => (
                        <Box key={index} w="10px" h="10px" bgColor={color} borderRadius="50%" />
                    ))}
                </HStack>
            </Center>
        </>
    );
};

export default PixelGrid;