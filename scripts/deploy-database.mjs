import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";

if (!process.env.TURSO_DATABASE_URL && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env");
  } catch {
    // The actionable missing-variable error below is clearer than a file error.
  }
}

function fail(message) {
  console.error(`[database] ${message}`);
  process.exit(1);
}

const databaseUrl =
  process.env.TURSO_DATABASE_URL?.trim() ||
  (!process.env.VERCEL ? "file:prisma/dev.db" : "");
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

if (!databaseUrl) {
  fail(
    "TURSO_DATABASE_URL is missing. Connect a Turso database to the Vercel project.",
  );
}

const localFile = databaseUrl.startsWith("file:");
if (process.env.VERCEL && localFile) {
  fail(
    "TURSO_DATABASE_URL cannot use a local file on Vercel. Connect a Turso Cloud database.",
  );
}
if (!localFile && !authToken) {
  fail(
    "TURSO_AUTH_TOKEN is missing. Reconnect the Turso integration or add the token in Vercel.",
  );
}

if (
  !localFile &&
  !databaseUrl.startsWith("libsql:") &&
  !databaseUrl.startsWith("https:") &&
  !databaseUrl.startsWith("http:") &&
  !databaseUrl.startsWith("wss:") &&
  !databaseUrl.startsWith("ws:")
) {
  fail("TURSO_DATABASE_URL must start with libsql://, https://, or file:.");
}

if (process.env.VERCEL) {
  const requiredVariables = [
    "AUTH_SECRET",
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missingVariables.length > 0) {
    fail(
      `Missing required Vercel environment variables: ${missingVariables.join(", ")}`,
    );
  }
}

const client = createClient({
  url: databaseUrl,
  authToken,
  intMode: "number",
  timeout: 5_000,
});

const migrationsDirectory = path.join(process.cwd(), "db", "migrations");

try {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "_techsastra_migrations" (
      "name" TEXT NOT NULL PRIMARY KEY,
      "appliedAt" INTEGER NOT NULL
    )
  `);

  const appliedResult = await client.execute(
    `SELECT "name" FROM "_techsastra_migrations"`,
  );
  const applied = new Set(appliedResult.rows.map((row) => String(row.name)));
  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  let appliedCount = 0;
  for (const name of migrationFiles) {
    if (applied.has(name)) continue;
    console.log(`[database] Applying ${name}`);
    const sql = await readFile(path.join(migrationsDirectory, name), "utf8");
    await client.executeMultiple(sql);
    await client.execute({
      sql: `
        INSERT OR IGNORE INTO "_techsastra_migrations" ("name", "appliedAt")
        VALUES (?, ?)
      `,
      args: [name, Date.now()],
    });
    appliedCount += 1;
  }

  if (appliedCount === 0) {
    console.log("[database] Turso schema is up to date.");
  } else {
    console.log(`[database] Applied ${appliedCount} migration(s).`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  fail(`Turso migration failed: ${message.replace(/eyJ[A-Za-z0-9._-]+/g, "[REDACTED_TOKEN]")}`);
} finally {
  client.close();
}
