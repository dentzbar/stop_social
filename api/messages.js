import { sql } from './db.js';

const MAX_BODY = 2000;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const userId = Number(req.query.user_id);
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    const withId = req.query.with_id !== undefined ? Number(req.query.with_id) : null;

    if (withId !== null) {
      if (!Number.isInteger(withId)) {
        return res.status(400).json({ error: 'with_id must be a number' });
      }
      const thread = await sql`
        select id, sender_id, recipient_id, body, read_at, created_at
        from messages
        where (sender_id = ${userId} and recipient_id = ${withId})
           or (sender_id = ${withId} and recipient_id = ${userId})
        order by created_at asc
      `;
      return res.status(200).json(thread);
    }

    // conversation list: latest message per counterpart, with unread count from them
    const conversations = await sql`
      with mine as (
        select *,
               case when sender_id = ${userId} then recipient_id else sender_id end as other_id
        from messages
        where sender_id = ${userId} or recipient_id = ${userId}
      ),
      latest as (
        select distinct on (other_id) other_id, body, created_at, sender_id
        from mine
        order by other_id, created_at desc
      ),
      unread as (
        select other_id, count(*)::int as unread_count
        from mine
        where recipient_id = ${userId} and read_at is null
        group by other_id
      )
      select u.id as user_id, u.name, u.avatar_type, u.avatar_value,
             latest.body as last_message, latest.created_at as last_message_at,
             latest.sender_id as last_message_sender_id,
             coalesce(unread.unread_count, 0) as unread_count
      from latest
      join users u on u.id = latest.other_id
      left join unread on unread.other_id = latest.other_id
      order by latest.created_at desc
    `;
    return res.status(200).json(conversations);
  }

  if (req.method === 'POST') {
    const { sender_id, recipient_id, body } = req.body ?? {};
    if (!Number.isInteger(sender_id) || !Number.isInteger(recipient_id)) {
      return res.status(400).json({ error: 'sender_id and recipient_id are required' });
    }
    if (sender_id === recipient_id) {
      return res.status(400).json({ error: 'cannot message yourself' });
    }
    if (!body || typeof body !== 'string' || !body.trim()) {
      return res.status(400).json({ error: 'body is required' });
    }

    const [message] = await sql`
      insert into messages (sender_id, recipient_id, body)
      values (${sender_id}, ${recipient_id}, ${body.trim().slice(0, MAX_BODY)})
      returning id, sender_id, recipient_id, body, read_at, created_at
    `;
    return res.status(201).json(message);
  }

  if (req.method === 'PATCH') {
    const { user_id, with_id } = req.body ?? {};
    if (!Number.isInteger(user_id) || !Number.isInteger(with_id)) {
      return res.status(400).json({ error: 'user_id and with_id are required' });
    }

    await sql`
      update messages set read_at = now()
      where recipient_id = ${user_id} and sender_id = ${with_id} and read_at is null
    `;
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, PATCH');
  return res.status(405).json({ error: 'method not allowed' });
}
