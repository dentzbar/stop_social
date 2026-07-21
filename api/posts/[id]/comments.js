import { sql } from '../../db.js';

const MAX_AUTHOR = 60;
const MAX_BODY = 1000;

export default async function handler(req, res) {
  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'invalid post id' });
  }

  if (req.method === 'GET') {
    const comments = await sql`
      select id, post_id, author, body, created_at
      from comments
      where post_id = ${id}
      order by created_at asc
    `;
    return res.status(200).json(comments);
  }

  if (req.method === 'POST') {
    const { author, body } = req.body ?? {};

    if (!author || typeof author !== 'string' || !author.trim()) {
      return res.status(400).json({ error: 'author is required' });
    }
    if (!body || typeof body !== 'string' || !body.trim()) {
      return res.status(400).json({ error: 'body is required' });
    }

    // ensure the post exists before inserting (FK would also catch it, but this gives a clean 404)
    const [post] = await sql`select id from posts where id = ${id}`;
    if (!post) {
      return res.status(404).json({ error: 'post not found' });
    }

    const [comment] = await sql`
      insert into comments (post_id, author, body)
      values (${id}, ${author.trim().slice(0, MAX_AUTHOR)}, ${body.trim().slice(0, MAX_BODY)})
      returning id, post_id, author, body, created_at
    `;
    return res.status(201).json(comment);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}
