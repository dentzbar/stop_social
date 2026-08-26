import { sql } from '../../db.js';

const MAX_BODY = 2000;

export default async function handler(req, res) {
  const groupId = Number(req.query.id);
  if (!Number.isInteger(groupId)) {
    return res.status(400).json({ error: 'invalid group id' });
  }

  if (req.method === 'GET') {
    const messages = await sql`
      select m.id, m.group_id, m.sender_id, m.body, m.created_at,
             u.name as sender_name, u.avatar_type, u.avatar_value
      from group_messages m
      join users u on u.id = m.sender_id
      where m.group_id = ${groupId}
      order by m.created_at asc
    `;
    return res.status(200).json(messages);
  }

  if (req.method === 'POST') {
    const { sender_id, body } = req.body ?? {};
    if (!Number.isInteger(sender_id)) {
      return res.status(400).json({ error: 'sender_id is required' });
    }
    if (!body || typeof body !== 'string' || !body.trim()) {
      return res.status(400).json({ error: 'body is required' });
    }

    const [member] = await sql`
      select 1 from group_members where group_id = ${groupId} and user_id = ${sender_id}
    `;
    if (!member) return res.status(403).json({ error: 'not a member of this group' });

    const [message] = await sql`
      insert into group_messages (group_id, sender_id, body)
      values (${groupId}, ${sender_id}, ${body.trim().slice(0, MAX_BODY)})
      returning id, group_id, sender_id, body, created_at
    `;
    return res.status(201).json(message);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}
