DROP TABLE IF EXISTS workout_logs;
DROP TABLE IF EXISTS exercises;

CREATE TABLE exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE workout_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_id INTEGER NOT NULL,
  weight REAL,
  reps INTEGER,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE INDEX idx_logs_exercise_date ON workout_logs(exercise_id, date DESC);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 初期データ
INSERT INTO exercises (name, tag) VALUES
  ('ラットプル', '背筋'),
  ('チェストプレス', '胸筋'),
  ('トルソローテーション', '脇腹'),
  ('レッグエクステンション', 'もも筋'),
  ('リアフライ', '背筋'),
  ('バックエクステンション', '背筋'),
  ('アブドミナル', '腹筋'),
  ('レッグプレス', '足全体'),
  ('ヒップアダクター', '内もも'),
  ('ヒップアブダクター', '中殿筋'),
  ('ショルダープレス', '肩'),
  ('ローイング', '背筋'),
  ('レッグカール', 'もも筋'),
  ('ベンチプレス', '胸筋');
