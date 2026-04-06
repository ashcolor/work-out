PRAGMA foreign_keys = OFF;

CREATE TABLE body_parts_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO body_parts_new (name, sort_order) VALUES
  ('肩', 1),
  ('胸', 2),
  ('腕', 3),
  ('背筋', 4),
  ('腹', 5),
  ('脚', 6);

CREATE TABLE exercises_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  body_part_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (body_part_id) REFERENCES body_parts_new(id) ON DELETE RESTRICT
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
  CASE
    WHEN body_parts.name = '肩' OR body_parts.sort_order = 1
      THEN (SELECT id FROM body_parts_new WHERE name = '肩')
    WHEN body_parts.name IN ('胸', '胸筋') OR body_parts.sort_order = 2
      THEN (SELECT id FROM body_parts_new WHERE name = '胸')
    WHEN body_parts.name IN ('腕', '上腕', '前腕')
      THEN (SELECT id FROM body_parts_new WHERE name = '腕')
    WHEN body_parts.name IN ('背筋', '背中') OR body_parts.sort_order = 3
      THEN (SELECT id FROM body_parts_new WHERE name = '背筋')
    WHEN body_parts.name IN ('腹', '腹筋', '腹斜筋', '体幹') OR body_parts.sort_order IN (4, 5)
      THEN (SELECT id FROM body_parts_new WHERE name = '腹')
    WHEN body_parts.name IN ('脚', '脚全体', '下半身', 'もも', '内もも', '尻', 'お尻', '臀部')
         OR body_parts.sort_order IN (6, 7, 8, 9)
      THEN (SELECT id FROM body_parts_new WHERE name = '脚')
    ELSE (SELECT id FROM body_parts_new WHERE name = '腕')
  END,
  exercises.created_at
FROM exercises
INNER JOIN body_parts ON body_parts.id = exercises.body_part_id;

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
DROP TABLE body_parts;
ALTER TABLE body_parts_new RENAME TO body_parts;
ALTER TABLE exercises_new RENAME TO exercises;
ALTER TABLE workout_logs_new RENAME TO workout_logs;

DELETE FROM sqlite_sequence WHERE name IN ('body_parts', 'exercises', 'workout_logs');
INSERT INTO sqlite_sequence (name, seq)
SELECT 'body_parts', COALESCE(MAX(id), 0) FROM body_parts;
INSERT INTO sqlite_sequence (name, seq)
SELECT 'exercises', COALESCE(MAX(id), 0) FROM exercises;
INSERT INTO sqlite_sequence (name, seq)
SELECT 'workout_logs', COALESCE(MAX(id), 0) FROM workout_logs;

CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_name_body_part
  ON exercises(name, body_part_id);

CREATE INDEX IF NOT EXISTS idx_logs_exercise_date
  ON workout_logs(exercise_id, date DESC);

PRAGMA foreign_keys = ON;
