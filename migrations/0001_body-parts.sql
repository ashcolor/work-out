PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS body_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

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

INSERT OR IGNORE INTO body_parts (name, sort_order)
SELECT
  unknown_tags.tag,
  100 + ROW_NUMBER() OVER (ORDER BY unknown_tags.tag)
FROM (
  SELECT DISTINCT tag
  FROM exercises
  WHERE tag IS NOT NULL
    AND tag NOT IN ('肩', '胸筋', '背筋', '腹筋', '脇腹', '中殿筋', 'もも筋', '内もも', '足全体')
) AS unknown_tags;

CREATE TABLE exercises_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  body_part_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (body_part_id) REFERENCES body_parts(id) ON DELETE RESTRICT
);

CREATE TABLE workout_logs_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_id INTEGER NOT NULL,
  weight REAL,
  reps INTEGER,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (exercise_id) REFERENCES exercises_new(id) ON DELETE CASCADE
);

INSERT INTO exercises_new (id, name, body_part_id, created_at)
SELECT
  exercises.id,
  exercises.name,
  body_parts.id,
  exercises.created_at
FROM exercises
INNER JOIN body_parts ON body_parts.name = exercises.tag;

INSERT INTO workout_logs_new (id, exercise_id, weight, reps, date, created_at)
SELECT
  workout_logs.id,
  workout_logs.exercise_id,
  workout_logs.weight,
  workout_logs.reps,
  workout_logs.date,
  workout_logs.created_at
FROM workout_logs;

DROP TABLE workout_logs;
DROP TABLE exercises;
ALTER TABLE exercises_new RENAME TO exercises;
ALTER TABLE workout_logs_new RENAME TO workout_logs;

CREATE INDEX IF NOT EXISTS idx_logs_exercise_date ON workout_logs(exercise_id, date DESC);

PRAGMA foreign_keys = ON;
