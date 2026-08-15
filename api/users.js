import { sql } from './db.js';

const MAX_NAME = 60;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const users = await sql`select id, name, avatar_type, avatar_value from users order by name asc`;
    return res.status(200).json(users);
  }

  if (req.method === 'POST') {
    const { name, avatar_type, avatar_value } = req.body ?? {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (avatar_type && avatar_type !== 'emoji' && avatar_type !== 'image') {
      return res.status(400).json({ error: 'avatar_type must be emoji or image' });
    }
    const trimmed = name.trim().slice(0, MAX_NAME);

    const [user] = await sql`
      insert into users (name, avatar_type, avatar_value)
      values (${trimmed}, ${avatar_type || 'emoji'}, ${avatar_value || '🙂'})
      on conflict (name) do update set name = excluded.name
      returning id, name, avatar_type, avatar_value
    `;
    return res.status(200).json(user);
  }

  if (req.method === 'PATCH') {
    const { id, avatar_type, avatar_value } = req.body ?? {};
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'id is required' });
    }
    if (!avatar_type || (avatar_type !== 'emoji' && avatar_type !== 'image')) {
      return res.status(400).json({ error: 'avatar_type must be emoji or image' });
    }
    if (!avatar_value || typeof avatar_value !== 'string') {
      return res.status(400).json({ error: 'avatar_value is required' });
    }

    const [user] = await sql`
      update users set avatar_type = ${avatar_type}, avatar_value = ${avatar_value}
      where id = ${id}
      returning id, name, avatar_type, avatar_value
    `;
    if (!user) return res.status(404).json({ error: 'user not found' });
    return res.status(200).json(user);
  }

  res.setHeader('Allow', 'GET, POST, PATCH');
  return res.status(405).json({ error: 'method not allowed' });
}
