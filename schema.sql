CREATE TABLE IF NOT EXISTS body_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  body_part_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (body_part_id) REFERENCES body_parts(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_id INTEGER NOT NULL,
  weight REAL,
  reps INTEGER,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_logs_exercise_date ON workout_logs(exercise_id, date DESC);

INSERT OR IGNORE INTO body_parts (name, sort_order) VALUES
  ('肩', 1),
  ('胸筋', 2),
  ('背筋', 3),
  ('腹筋', 4),
  ('脇腹', 5),
  ('中殿筋', 6),
  ('もも筋', 7),
  ('内もも', 8),
  ('足全体', 9);

INSERT INTO exercises (name, body_part_id)
SELECT 'ラットプル', body_parts.id
FROM body_parts
WHERE body_parts.name = '背筋'
  AND NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE exercises.name = 'ラットプル'
      AND exercises.body_part_id = body_parts.id
  );

INSERT INTO exercises (name, body_part_id)
SELECT 'チェストプレス', body_parts.id
FROM body_parts
WHERE body_parts.name = '胸筋'
  AND NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE exercises.name = 'チェストプレス'
      AND exercises.body_part_id = body_parts.id
  );

INSERT INTO exercises (name, body_part_id)
SELECT 'トルソローテーション', body_parts.id
FROM body_parts
WHERE body_parts.name = '脇腹'
  AND NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE exercises.name = 'トルソローテーション'
      AND exercises.body_part_id = body_parts.id
  );

INSERT INTO exercises (name, body_part_id)
SELECT 'レッグエクステンション', body_parts.id
FROM body_parts
WHERE body_parts.name = 'もも筋'
  AND NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE exercises.name = 'レッグエクステンション'
      AND exercises.body_part_id = body_parts.id
  );

INSERT INTO exercises (name, body_part_id)
SELECT 'リアフライ', body_parts.id
FROM body_parts
WHERE body_parts.name = '背筋'
  AND NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE exercises.name = 'リアフライ'
      AND exercises.body_part_id = body_parts.id
  );

INSERT INTO exercises (name, body_part_id)
SELECT 'バックエクステンション', body_parts.id
FROM body_parts
WHERE body_parts.name = '背筋'
  AND NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE exercises.name = 'バックエクステンション'
      AND exercises.body_part_id = body_parts.id
  );

INSERT INTO exercises (name, body_part_id)
SELECT 'アブドミナル', body_parts.id
FROM body_parts
WHERE body_parts.name = '腹筋'
  AND NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE exercises.name = 'アブドミナル'
      AND exercises.body_part_id = body_parts.id
  );

INSERT INTO exercises (name, body_part_id)
SELECT 'レッグプレス', body_parts.id
FROM body_parts
WHERE body_parts.name = '足全体'
  AND NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE exercises.name = 'レッグプレス'
      AND exercises.body_part_id = body_parts.id
  );

INSERT INTO exercises (name, body_part_id)
SELECT 'ヒップアダクター', body_parts.id
FROM body_parts
WHERE body_parts.name = '内もも'
  AND NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE exercises.name = 'ヒップアダクター'
      AND exercises.body_part_id = body_parts.id
  );

INSERT INTO exercises (name, body_part_id)
SELECT 'ヒップアブダクター', body_parts.id
FROM body_parts
WHERE body_parts.name = '中殿筋'
  AND NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE exercises.name = 'ヒップアブダクター'
      AND exercises.body_part_id = body_parts.id
  );

INSERT INTO exercises (name, body_part_id)
SELECT 'ショルダープレス', body_parts.id
FROM body_parts
WHERE body_parts.name = '肩'
  AND NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE exercises.name = 'ショルダープレス'
      AND exercises.body_part_id = body_parts.id
  );

INSERT INTO exercises (name, body_part_id)
SELECT 'ローイング', body_parts.id
FROM body_parts
WHERE body_parts.name = '背筋'
  AND NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE exercises.name = 'ローイング'
      AND exercises.body_part_id = body_parts.id
  );

INSERT INTO exercises (name, body_part_id)
SELECT 'レッグカール', body_parts.id
FROM body_parts
WHERE body_parts.name = 'もも筋'
  AND NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE exercises.name = 'レッグカール'
      AND exercises.body_part_id = body_parts.id
  );

INSERT INTO exercises (name, body_part_id)
SELECT 'ベンチプレス', body_parts.id
FROM body_parts
WHERE body_parts.name = '胸筋'
  AND NOT EXISTS (
    SELECT 1
    FROM exercises
    WHERE exercises.name = 'ベンチプレス'
      AND exercises.body_part_id = body_parts.id
  );
