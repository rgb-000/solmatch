import { NextApiRequest, NextApiResponse } from 'next';
<<<<<<< HEAD
import crypto from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { hash } = req.body;
        
        const key = process.env.ANON; 

        const imageHash = encrypt(hash, key);
        
        console.log('imageHash: ', imageHash)
        return res.json({ imageHash });

    }
    return res.status(405).end(); 
}

=======
import sharp from 'sharp';
import crypto from 'crypto';

>>>>>>> 3c64e9f5ea7ebb8f76a843ec1317d5256d566c09
function encrypt(text: any, key: any) {
    const iv = Buffer.from('0123456789abcdef', 'utf-8');
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'utf-8'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}
<<<<<<< HEAD
=======

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        try {
            
            const imageData = req.body.imageData;
            const size = Number(req.body.size);
            const base64Data = imageData.split(",")[1];
            const buffer = Buffer.from(base64Data, 'base64');
   
            const rawPixelData = await sharp(buffer)
                .resize(size, size, { kernel: sharp.kernel.nearest })
                .toBuffer();

            const hash = crypto.createHash('sha256').update(rawPixelData).digest('hex');
            console.log('image hash: ', hash)

            const key = process.env.ANON; 
            const canvasHash = encrypt(hash, key);
        
            res.status(200).json({ canvasHash });

        } catch (error) {
            res.status(500).json({ error: 'Failed to generate hash' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
>>>>>>> 3c64e9f5ea7ebb8f76a843ec1317d5256d566c09
