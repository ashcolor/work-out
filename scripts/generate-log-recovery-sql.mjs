import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const [, , backupPathArg, outputPathArg] = process.argv;

if (!backupPathArg || !outputPathArg) {
  console.error("Usage: node scripts/generate-log-recovery-sql.mjs <backup.sql> <output.sql>");
  process.exit(1);
}

const backupPath = path.resolve(backupPathArg);
const outputPath = path.resolve(outputPathArg);
const backupSql = readFileSync(backupPath, "utf8");

function sqlValue(value) {
  if (value == null) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

const db = new DatabaseSync(":memory:");
db.exec(backupSql);

const rows = db
  .prepare(`
    SELECT
      exercises.name AS exercise_name,
      body_parts.name AS body_part_name,
      workout_logs.weight AS weight,
      workout_logs.reps AS reps,
      workout_logs.date AS date,
      workout_logs.created_at AS created_at
    FROM workout_logs
    INNER JOIN exercises ON exercises.id = workout_logs.exercise_id
    INNER JOIN body_parts ON body_parts.id = exercises.body_part_id
    ORDER BY workout_logs.date, workout_logs.id
  `)
  .all();

const bodyPartNames = [...new Set(rows.map((row) => row.body_part_name))].sort((a, b) =>
  a.localeCompare(b, "ja")
);

const lines = [];
lines.push("BEGIN TRANSACTION;");
lines.push("");
lines.push("CREATE TEMP TABLE recovery_body_parts (");
lines.push("  name TEXT PRIMARY KEY");
lines.push(");");
lines.push("");
lines.push("CREATE TEMP TABLE recovery_logs (");
lines.push("  exercise_name TEXT NOT NULL,");
lines.push("  body_part_name TEXT NOT NULL,");
lines.push("  weight REAL,");
lines.push("  reps INTEGER,");
lines.push("  date TEXT NOT NULL,");
lines.push("  created_at TEXT");
lines.push(");");
lines.push("");

for (const bodyPartName of bodyPartNames) {
  lines.push(`INSERT INTO recovery_body_parts (name) VALUES (${sqlValue(bodyPartName)});`);
}

lines.push("");

for (const row of rows) {
  lines.push(
    `INSERT INTO recovery_logs (exercise_name, body_part_name, weight, reps, date, created_at) VALUES (${[
      row.exercise_name,
      row.body_part_name,
      row.weight,
      row.reps,
      row.date,
      row.created_at,
    ]
      .map(sqlValue)
      .join(", ")});`
  );
}

lines.push("");
lines.push("-- Add missing body parts at the end of the current sort order if needed.");
lines.push(
  "INSERT INTO body_parts (name, sort_order) " +
    "SELECT missing_body_parts.name, " +
    "(SELECT COALESCE(MAX(sort_order), 0) FROM body_parts) + ROW_NUMBER() OVER (ORDER BY missing_body_parts.name) " +
    "FROM (" +
    "  SELECT recovery_body_parts.name " +
    "  FROM recovery_body_parts " +
    "  WHERE NOT EXISTS (" +
    "    SELECT 1 FROM body_parts WHERE body_parts.name = recovery_body_parts.name" +
    "  )" +
    ") AS missing_body_parts;"
);
lines.push("");
lines.push("-- Add missing exercises by name + body part if needed.");
lines.push(
  "INSERT INTO exercises (name, body_part_id, created_at) " +
    "SELECT missing_exercises.exercise_name, body_parts.id, MIN(missing_exercises.created_at) " +
    "FROM (" +
    "  SELECT recovery_logs.exercise_name, recovery_logs.body_part_name, recovery_logs.created_at " +
    "  FROM recovery_logs" +
    ") AS missing_exercises " +
    "INNER JOIN body_parts ON body_parts.name = missing_exercises.body_part_name " +
    "WHERE NOT EXISTS (" +
    "  SELECT 1 FROM exercises " +
    "  WHERE exercises.name = missing_exercises.exercise_name AND exercises.body_part_id = body_parts.id" +
    ") " +
    "GROUP BY missing_exercises.exercise_name, body_parts.id;"
);
lines.push("");
lines.push("-- Insert logs while skipping rows already present.");
lines.push(
  "INSERT INTO workout_logs (exercise_id, weight, reps, date, created_at) " +
    "SELECT exercises.id, recovery_logs.weight, recovery_logs.reps, recovery_logs.date, recovery_logs.created_at " +
    "FROM recovery_logs " +
    "INNER JOIN body_parts ON body_parts.name = recovery_logs.body_part_name " +
    "INNER JOIN exercises ON exercises.name = recovery_logs.exercise_name AND exercises.body_part_id = body_parts.id " +
    "WHERE NOT EXISTS (" +
    "  SELECT 1 FROM workout_logs " +
    "  WHERE workout_logs.exercise_id = exercises.id " +
    "    AND COALESCE(workout_logs.weight, -1) = COALESCE(recovery_logs.weight, -1) " +
    "    AND COALESCE(workout_logs.reps, -1) = COALESCE(recovery_logs.reps, -1) " +
    "    AND workout_logs.date = recovery_logs.date " +
    "    AND COALESCE(workout_logs.created_at, '') = COALESCE(recovery_logs.created_at, '')" +
    ");"
);
lines.push("");
lines.push("DROP TABLE recovery_logs;");
lines.push("DROP TABLE recovery_body_parts;");
lines.push("COMMIT;");
lines.push("");

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, lines.join("\n"), "utf8");

console.log(`Wrote recovery SQL: ${outputPath}`);
console.log(`Recovered log rows in source backup: ${rows.length}`);

db.close();
