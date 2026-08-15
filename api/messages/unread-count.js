import { sql } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method not allowed' });
  }

  const userId = Number(req.query.user_id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  const [{ count }] = await sql`
    select count(*)::int as count
    from messages
    where recipient_id = ${userId} and read_at is null
  `;
  return res.status(200).json({ count });
}
