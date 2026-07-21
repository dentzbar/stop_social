import { sql } from '../../db.js';

// Static query per reaction type. Neon's tagged template only parameterizes
// values, not identifiers, so we branch instead of interpolating a column name.
async function bump(id, type) {
  switch (type) {
    case 'heart':
      return sql`update posts set reactions_heart = reactions_heart + 1 where id = ${id} returning id, reactions_heart, reactions_thumb, reactions_hundred`;
    case 'thumb':
      return sql`update posts set reactions_thumb = reactions_thumb + 1 where id = ${id} returning id, reactions_heart, reactions_thumb, reactions_hundred`;
    case 'hundred':
      return sql`update posts set reactions_hundred = reactions_hundred + 1 where id = ${id} returning id, reactions_heart, reactions_thumb, reactions_hundred`;
    default:
      return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'invalid post id' });
  }

  const type = req.body?.type ?? 'heart';
  const rows = await bump(id, type);
  if (rows === null) {
    return res.status(400).json({ error: 'invalid reaction type' });
  }

  const [post] = rows;
  if (!post) {
    return res.status(404).json({ error: 'post not found' });
  }

  return res.status(200).json(post);
}
