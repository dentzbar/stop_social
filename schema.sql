create table if not exists posts (
  id serial primary key,
  title text not null,
  description text not null default 'ללא תיאור',
  category text not null,
  price text not null,
  location text not null default 'לא צוין',
  emoji text not null,
  color text not null,
  image_url text,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);
