import { sql } from './db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // group_id scopes the feed: omitted → public posts only, a number → that group's posts
    const groupId = req.query.group_id !== undefined ? Number(req.query.group_id) : null;
    if (groupId !== null && !Number.isInteger(groupId)) {
      return res.status(400).json({ error: 'group_id must be a number' });
    }

    const posts = groupId === null
      ? await sql`
          select id, title, description, category, price, location, author, emoji, color, image_url,
                 media_type, poster_url, group_id,
                 reactions_heart, reactions_thumb, reactions_hundred, created_at
          from posts
          where group_id is null
          order by created_at desc
        `
      : await sql`
          select id, title, description, category, price, location, author, emoji, color, image_url,
                 media_type, poster_url, group_id,
                 reactions_heart, reactions_thumb, reactions_hundred, created_at
          from posts
          where group_id = ${groupId}
          order by created_at desc
        `;
    return res.status(200).json(posts);
  }

  if (req.method === 'POST') {
    const { title, description, category, price, location, author, emoji, color, image_url, media_type, poster_url, group_id } = req.body ?? {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!author || typeof author !== 'string' || !author.trim()) {
      return res.status(400).json({ error: 'author is required' });
    }
    if (!category || !price || !emoji || !color) {
      return res.status(400).json({ error: 'category, price, emoji and color are required' });
    }
    if (media_type && media_type !== 'image' && media_type !== 'video') {
      return res.status(400).json({ error: 'media_type must be image or video' });
    }
    if (group_id != null && !Number.isInteger(group_id)) {
      return res.status(400).json({ error: 'group_id must be a number' });
    }

    const [post] = await sql`
      insert into posts (title, description, category, price, location, author, emoji, color, image_url, media_type, poster_url, group_id)
      values (
        ${title.trim()},
        ${description?.trim() || 'ללא תיאור'},
        ${category},
        ${price},
        ${location?.trim() || 'לא צוין'},
        ${author.trim().slice(0, 60)},
        ${emoji},
        ${color},
        ${image_url ?? null},
        ${media_type || 'image'},
        ${poster_url ?? null},
        ${group_id ?? null}
      )
      returning id, title, description, category, price, location, author, emoji, color, image_url,
                media_type, poster_url, group_id,
                reactions_heart, reactions_thumb, reactions_hundred, created_at
    `;
    return res.status(201).json(post);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}
