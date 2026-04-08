create table guesses (
  id uuid primary key default gen_random_uuid(),
  player_name text,
  car_id uuid references cars(id),
  guessed_price integer,
  actual_price integer,
  score integer,
  played_at timestamptz default now()
);
