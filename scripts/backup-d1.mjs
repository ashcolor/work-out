import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const target = process.argv[2];
const npxBin = process.platform === "win32" ? "npx.exe" : "npx";

if (target !== "local" && target !== "remote") {
  console.error("Usage: node scripts/backup-d1.mjs <local|remote>");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join("backups", target);
const outputPath = path.join(backupDir, `work-out-${target}-${timestamp}.sql`);

mkdirSync(backupDir, { recursive: true });

const args = [
  "wrangler",
  "d1",
  "export",
  "work-out",
  `--${target}`,
  "--output",
  outputPath,
];

const result = spawnSync(npxBin, args, {
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Backup created: ${outputPath}`);
