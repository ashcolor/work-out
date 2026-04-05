import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const target = process.argv[2];
const npxBin = process.platform === "win32" ? "npx.exe" : "npx";

if (target !== "local" && target !== "remote") {
  console.error("Usage: node scripts/migrate-d1.mjs <local|remote>");
  process.exit(1);
}

function runWrangler(args, captureOutput = false) {
  const result = spawnSync(npxBin, ["wrangler", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: captureOutput ? "pipe" : "inherit",
  });

  if (result.status !== 0) {
    if (captureOutput) {
      process.stderr.write(result.stderr ?? "");
      process.stdout.write(result.stdout ?? "");
    }
    process.exit(result.status ?? 1);
  }

  return captureOutput ? result.stdout : "";
}

function queryJson(sql) {
  const stdout = runWrangler(
    ["d1", "execute", "work-out", `--${target}`, "--command", sql, "--json"],
    true
  );
  const parsed = JSON.parse(stdout);
  return parsed[0]?.results ?? [];
}

function backupFirst() {
  const scriptPath = path.join("scripts", "backup-d1.mjs");
  const result = spawnSync(process.execPath, [scriptPath, target], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

backupFirst();

const tables = queryJson("SELECT name FROM sqlite_master WHERE type = 'table'");
const tableNames = new Set(tables.map((row) => row.name));
const hasExercises = tableNames.has("exercises");
const hasBodyParts = tableNames.has("body_parts");

if (!hasExercises) {
  console.log("No exercises table found. Applying safe bootstrap schema.");
  runWrangler(["d1", "execute", "work-out", `--${target}`, "--file", "schema.sql"]);
  process.exit(0);
}

const columns = queryJson("PRAGMA table_info(exercises)");
const columnNames = new Set(columns.map((row) => row.name));
const isNewSchema = hasBodyParts && columnNames.has("body_part_id");
const isOldSchema = columnNames.has("tag") && !columnNames.has("body_part_id");

if (isNewSchema) {
  console.log("Database is already migrated. No changes applied.");
  process.exit(0);
}

if (!isOldSchema) {
  console.error("Unknown exercises schema. Migration aborted without changing data.");
  process.exit(1);
}

const migrationPath = path.join("migrations", "0001_body-parts.sql");
const migrationSql = readFileSync(migrationPath, "utf8");

if (!migrationSql.trim()) {
  console.error("Migration file is empty.");
  process.exit(1);
}

console.log("Old schema detected. Applying non-destructive body part migration.");
runWrangler(["d1", "execute", "work-out", `--${target}`, "--file", migrationPath]);
