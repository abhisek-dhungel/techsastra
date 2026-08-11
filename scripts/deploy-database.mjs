import { spawnSync } from "node:child_process";
import path from "node:path";

const INITIAL_MIGRATION = "20260810000000_init";

// Vercel injects variables directly. For local deployment checks, mirror Prisma's
// normal behavior by loading the gitignored root .env when Node supports it.
if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env");
  } catch {
    // The actionable missing-variable error below is clearer than a file error.
  }
}

const rawDatabaseUrl = process.env.DATABASE_URL?.trim();

function fail(message) {
  console.error(`[database] ${message}`);
  process.exit(1);
}

if (!rawDatabaseUrl) {
  fail(
    "DATABASE_URL is missing. Add Railway's public MySQL URL to the Vercel Production environment.",
  );
}

let databaseUrl;
try {
  databaseUrl = new URL(rawDatabaseUrl);
} catch {
  fail("DATABASE_URL is not a valid URL.");
}

if (databaseUrl.protocol !== "mysql:") {
  fail("DATABASE_URL must start with mysql:// for this project.");
}

if (
  process.env.VERCEL &&
  (databaseUrl.hostname === "railway.internal" ||
    databaseUrl.hostname.endsWith(".railway.internal"))
) {
  fail(
    "DATABASE_URL uses a private Railway hostname. Vercel requires the public TCP proxy URL (*.proxy.rlwy.net).",
  );
}

if (!databaseUrl.username || !databaseUrl.hostname || !databaseUrl.pathname.slice(1)) {
  fail("DATABASE_URL must include a username, host, and database name.");
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

const prismaExecutable = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma",
);

function redact(output) {
  return String(output || "")
    .split(rawDatabaseUrl)
    .join("[REDACTED_DATABASE_URL]")
    .replace(/mysql:\/\/[^\s@]+@/gi, "mysql://[REDACTED]@");
}

function printResult(result) {
  const stdout = redact(result.stdout);
  const stderr = redact(result.stderr);
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

function runPrisma(args, { capture = false } = {}) {
  const result = spawnSync(prismaExecutable, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    stdio: capture ? ["inherit", "pipe", "pipe"] : "inherit",
  });

  if (result.error) {
    fail(`Could not start Prisma CLI: ${result.error.message}`);
  }

  return result;
}

const port = databaseUrl.port || "3306";
const databaseName = databaseUrl.pathname.slice(1);
console.log(
  `[database] Deploying migrations to ${databaseUrl.hostname}:${port}/${databaseName}`,
);

let deployResult = runPrisma(["migrate", "deploy"], { capture: true });

if (deployResult.status === 0) {
  printResult(deployResult);
  console.log("[database] Migrations are up to date.");
  process.exit(0);
}

const deployOutput = `${deployResult.stdout || ""}\n${deployResult.stderr || ""}`;
const needsBaseline =
  deployOutput.includes("P3005") ||
  deployOutput.toLowerCase().includes("database schema is not empty");

if (!needsBaseline) {
  printResult(deployResult);
  fail("Prisma migration deployment failed.");
}

console.log(
  "[database] Existing tables detected without migration history; validating the schema before creating a one-time baseline.",
);

const pushResult = runPrisma(["db", "push", "--skip-generate"]);
if (pushResult.status !== 0) {
  fail(
    "The existing database could not be aligned safely. No data-loss override was used.",
  );
}

const resolveResult = runPrisma(
  ["migrate", "resolve", "--applied", INITIAL_MIGRATION],
  { capture: true },
);
if (resolveResult.status !== 0) {
  const resolveOutput = `${resolveResult.stdout || ""}\n${resolveResult.stderr || ""}`;
  const alreadyApplied =
    resolveOutput.includes("P3008") ||
    resolveOutput.toLowerCase().includes("already recorded as applied");
  if (!alreadyApplied) {
    printResult(resolveResult);
    fail("The existing database was aligned, but its migration baseline failed.");
  }
  console.log("[database] Another deployment already created the baseline.");
} else {
  printResult(resolveResult);
}

deployResult = runPrisma(["migrate", "deploy"]);
if (deployResult.status !== 0) {
  fail("Migration deployment failed after creating the baseline.");
}

console.log("[database] Existing database baselined and migrations are up to date.");
