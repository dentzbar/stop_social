import { sql } from './db.js';

// Derives notifications from unread messages, grouped by sender.
// A single source of truth (messages.read_at) keeps this in sync with the
// messaging system without a separate write path. Future notification types
// can be unioned in here without changing the frontend contract.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method not allowed' });
  }

  const userId = Number(req.query.user_id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  const notifications = await sql`
    select u.id as user_id, u.name, u.avatar_type, u.avatar_value,
           count(*)::int as unread_count,
           max(m.created_at) as last_message_at,
           (array_agg(m.body order by m.created_at desc))[1] as last_message
    from messages m
    join users u on u.id = m.sender_id
    where m.recipient_id = ${userId} and m.read_at is null
    group by u.id, u.name, u.avatar_type, u.avatar_value
    order by last_message_at desc
  `;
  return res.status(200).json(notifications);
}
