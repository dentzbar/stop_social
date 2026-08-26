import { sql } from './db.js';

const MAX_NAME = 60;
const MAX_DESCRIPTION = 300;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // user_id is optional — when present each group also reports whether that user is a member
    const userId = req.query.user_id !== undefined ? Number(req.query.user_id) : null;
    if (userId !== null && !Number.isInteger(userId)) {
      return res.status(400).json({ error: 'user_id must be a number' });
    }

    const groups = await sql`
      select g.id, g.name, g.description, g.emoji, g.image_url, g.created_by, g.created_at,
             (select count(*)::int from group_members gm where gm.group_id = g.id) as member_count,
             (select count(*)::int from posts p where p.group_id = g.id) as post_count,
             case when ${userId}::int is null then false
                  else exists (select 1 from group_members gm
                               where gm.group_id = g.id and gm.user_id = ${userId})
             end as is_member
      from groups g
      order by g.created_at desc
    `;
    return res.status(200).json(groups);
  }

  if (req.method === 'POST') {
    const { name, description, emoji, image_url, created_by } = req.body ?? {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!Number.isInteger(created_by)) {
      return res.status(400).json({ error: 'created_by is required' });
    }

    const trimmed = name.trim().slice(0, MAX_NAME);
    const [existing] = await sql`select id from groups where name = ${trimmed}`;
    if (existing) {
      return res.status(409).json({ error: 'group name already taken' });
    }

    const [group] = await sql`
      insert into groups (name, description, emoji, image_url, created_by)
      values (
        ${trimmed},
        ${(description ?? '').trim().slice(0, MAX_DESCRIPTION)},
        ${emoji || '👥'},
        ${image_url ?? null},
        ${created_by}
      )
      returning id, name, description, emoji, image_url, created_by, created_at
    `;

    // the creator is always the first member
    await sql`
      insert into group_members (group_id, user_id)
      values (${group.id}, ${created_by})
      on conflict do nothing
    `;

    return res.status(201).json({ ...group, member_count: 1, post_count: 0, is_member: true });
  }

  if (req.method === 'PATCH') {
    const { id, image_url } = req.body ?? {};
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'id is required' });
    }

    const [group] = await sql`
      update groups set image_url = ${image_url ?? null}
      where id = ${id}
      returning id, name, description, emoji, image_url, created_by, created_at
    `;
    if (!group) return res.status(404).json({ error: 'group not found' });
    return res.status(200).json(group);
  }

  res.setHeader('Allow', 'GET, POST, PATCH');
  return res.status(405).json({ error: 'method not allowed' });
}
