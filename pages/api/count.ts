// pages/api/count.ts

import { createClient } from '@vercel/kv';

const kv = createClient({
  url: `${process.env.KV_REST_API_URL}`,
  token: `${process.env.KV_REST_API_TOKEN}`,
});

export default async (req: any, res: any) => {

  try {
    const { index } = req.body;

    // Validate provided data 
    if (!index) {
      return res.status(400).json({ error: 'Required data missing.' });
    }

      const count = Number(await kv.get(`index_${index}`));
      return res.status(200).json({count});

  } catch (error) {

    res.status(500).json();
  }
};
