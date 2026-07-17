import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  const filename = req.headers['x-filename'] || `upload-${Date.now()}`;
  const contentType = req.headers['content-type'] || 'application/octet-stream';

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);

  if (buffer.length === 0) {
    return res.status(400).json({ error: 'no file data received' });
  }

  const blob = await put(filename, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: true,
  });

  return res.status(201).json({ url: blob.url });
}
