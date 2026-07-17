import { sql } from '../../db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'invalid post id' });
  }

  const [post] = await sql`
    update posts set likes = likes + 1 where id = ${id}
    returning id, likes
  `;

  if (!post) {
    return res.status(404).json({ error: 'post not found' });
  }

  return res.status(200).json(post);
}
