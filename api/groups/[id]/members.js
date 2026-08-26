import { sql } from '../../db.js';

export default async function handler(req, res) {
  const groupId = Number(req.query.id);
  if (!Number.isInteger(groupId)) {
    return res.status(400).json({ error: 'invalid group id' });
  }

  if (req.method === 'GET') {
    const members = await sql`
      select u.id, u.name, u.avatar_type, u.avatar_value, gm.joined_at
      from group_members gm
      join users u on u.id = gm.user_id
      where gm.group_id = ${groupId}
      order by gm.joined_at asc
    `;
    return res.status(200).json(members);
  }

  if (req.method === 'POST') {
    const { user_id } = req.body ?? {};
    if (!Number.isInteger(user_id)) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const [group] = await sql`select id from groups where id = ${groupId}`;
    if (!group) return res.status(404).json({ error: 'group not found' });

    await sql`
      insert into group_members (group_id, user_id)
      values (${groupId}, ${user_id})
      on conflict do nothing
    `;
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const user_id = Number(req.query.user_id ?? req.body?.user_id);
    if (!Number.isInteger(user_id)) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    await sql`delete from group_members where group_id = ${groupId} and user_id = ${user_id}`;
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'method not allowed' });
}
