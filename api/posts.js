import { sql } from './db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const posts = await sql`
      select id, title, description, category, price, location, emoji, color, image_url, likes, created_at
      from posts
      order by created_at desc
    `;
    return res.status(200).json(posts);
  }

  if (req.method === 'POST') {
    const { title, description, category, price, location, emoji, color, image_url } = req.body ?? {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!category || !price || !emoji || !color) {
      return res.status(400).json({ error: 'category, price, emoji and color are required' });
    }

    const [post] = await sql`
      insert into posts (title, description, category, price, location, emoji, color, image_url)
      values (
        ${title.trim()},
        ${description?.trim() || 'ללא תיאור'},
        ${category},
        ${price},
        ${location?.trim() || 'לא צוין'},
        ${emoji},
        ${color},
        ${image_url ?? null}
      )
      returning id, title, description, category, price, location, emoji, color, image_url, likes, created_at
    `;
    return res.status(201).json(post);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}
