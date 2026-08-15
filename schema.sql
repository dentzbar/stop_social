create table if not exists posts (
  id serial primary key,
  title text not null,
  description text not null default 'ללא תיאור',
  category text not null,
  price text not null,
  location text not null default 'לא צוין',
  author text not null default 'אנונימי',
  emoji text not null,
  color text not null,
  image_url text,
  likes integer not null default 0,
  reactions_heart integer not null default 0,
  reactions_thumb integer not null default 0,
  reactions_hundred integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id serial primary key,
  post_id integer not null references posts(id) on delete cascade,
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on comments(post_id, created_at);

-- migration for existing deployments: add reaction columns, seed heart from legacy likes
alter table posts add column if not exists reactions_heart integer not null default 0;
alter table posts add column if not exists reactions_thumb integer not null default 0;
alter table posts add column if not exists reactions_hundred integer not null default 0;
alter table posts add column if not exists author text not null default 'אנונימי';
update posts set reactions_heart = likes where reactions_heart = 0 and likes > 0;

-- migration: video support (media_type distinguishes image/video, poster_url is the static feed thumbnail for videos)
alter table posts add column if not exists media_type text not null default 'image';
alter table posts add column if not exists poster_url text;

-- migration: simple users table (name-only identity, chosen or created on entry)
create table if not exists users (
  id serial primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into users (name)
select distinct author from posts
where author is not null and author <> ''
on conflict (name) do nothing;

-- migration: user profile picture — either a chosen emoji or an uploaded image (blob url)
alter table users add column if not exists avatar_type text not null default 'emoji';
alter table users add column if not exists avatar_value text not null default '🙂';
