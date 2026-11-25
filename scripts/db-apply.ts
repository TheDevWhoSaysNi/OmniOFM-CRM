// Applies every *.sql migration file in migrations/, in sorted order.
// Usage: npm run db:apply   (reads DATABASE_URL from apps/api/.env)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, "apps/api/.env");
if (!process.env.DATABASE_URL && fs.existsSync(envFile)) {
  const line = fs
    .readFileSync(envFile, "utf8")
    .split("\n")
    .find((l) => l.startsWith("DATABASE_URL="));
  if (line) process.env.DATABASE_URL = line.slice("DATABASE_URL=".length).trim();
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");

const migDir = path.join(root, "migrations");
const files = fs.existsSync(migDir)
  ? fs.readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort()
  : [];
if (!files.length) {
  console.log("No SQL files found in migrations/");
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const f of files) {
    const sql = fs.readFileSync(path.join(migDir, f), "utf8");
    await client.query(sql);
  }
  await client.query("COMMIT");
  const { rows } = await client.query<{ table_name: string }>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1",
  );
  console.log(`Applied ${files.length} migration(s). Tables:\n- ${rows.map((r) => r.table_name).join("\n- ")}`);
} catch (e) {
  await client.query("ROLLBACK");
  console.error("Failed, rolled back:", (e as Error).message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
