import { sql } from './db.js';

// "Climbing monkey" leaderboard: one row per user, keeping their best (fastest) finish time.
const DIFFICULTIES = new Set(['easy', 'normal', 'hard']);
const MIN_TIME_MS = 15_000; // faster than this is not physically possible in the game
const MAX_TIME_MS = 60 * 60 * 1000;
const LEADERBOARD_SIZE = 20;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const rows = await sql`
      select s.user_id, u.name, u.avatar_type, u.avatar_value,
             s.best_time_ms, s.best_difficulty, s.wins, s.games
      from monkey_climb_scores s
      join users u on u.id = s.user_id
      order by s.best_time_ms asc, s.updated_at asc
      limit ${LEADERBOARD_SIZE}
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { user_id, time_ms, place, difficulty } = req.body ?? {};
    if (!Number.isInteger(user_id)) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    if (!Number.isInteger(time_ms) || time_ms < MIN_TIME_MS || time_ms > MAX_TIME_MS) {
      return res.status(400).json({ error: 'time_ms is out of range' });
    }
    if (!Number.isInteger(place) || place < 1 || place > 4) {
      return res.status(400).json({ error: 'place must be 1-4' });
    }
    if (!DIFFICULTIES.has(difficulty)) {
      return res.status(400).json({ error: 'difficulty must be easy, normal or hard' });
    }

    const [user] = await sql`select id from users where id = ${user_id}`;
    if (!user) return res.status(404).json({ error: 'user not found' });

    const [previous] = await sql`select best_time_ms from monkey_climb_scores where user_id = ${user_id}`;

    // SET expressions all read the pre-update row, so the CASE compares against the old best.
    const [row] = await sql`
      insert into monkey_climb_scores (user_id, best_time_ms, best_difficulty, wins, games)
      values (${user_id}, ${time_ms}, ${difficulty}, ${place === 1 ? 1 : 0}, 1)
      on conflict (user_id) do update set
        best_difficulty = case when excluded.best_time_ms < monkey_climb_scores.best_time_ms
                               then excluded.best_difficulty
                               else monkey_climb_scores.best_difficulty end,
        best_time_ms = least(monkey_climb_scores.best_time_ms, excluded.best_time_ms),
        wins = monkey_climb_scores.wins + excluded.wins,
        games = monkey_climb_scores.games + 1,
        updated_at = now()
      returning user_id, best_time_ms, best_difficulty, wins, games
    `;
    const [{ rank }] = await sql`
      select count(*)::int + 1 as rank from monkey_climb_scores where best_time_ms < ${row.best_time_ms}
    `;
    const isNewBest = !previous || time_ms < previous.best_time_ms;
    return res.status(200).json({ ...row, rank, is_new_best: isNewBest });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}
