import { createClient, type Client, type Row } from "@libsql/client";

const globalForTurso = globalThis as unknown as {
  techsastraTurso?: Client;
};

export class TursoConfigurationError extends Error {
  constructor(readonly missingVariables: string[]) {
    super(`Missing Turso configuration: ${missingVariables.join(", ")}`);
    this.name = "TursoConfigurationError";
  }
}

function databaseConfiguration() {
  const configuredUrl = process.env.TURSO_DATABASE_URL?.trim();
  const url =
    configuredUrl ||
    (!process.env.VERCEL ? "file:prisma/dev.db" : "");

  if (!url) {
    throw new TursoConfigurationError(["TURSO_DATABASE_URL"]);
  }

  const isLocalFile = url.startsWith("file:");
  if (process.env.VERCEL && isLocalFile) {
    throw new Error(
      "TURSO_DATABASE_URL cannot use a local file on Vercel. Connect a Turso Cloud database.",
    );
  }
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!isLocalFile && !authToken) {
    throw new TursoConfigurationError(["TURSO_AUTH_TOKEN"]);
  }

  if (
    !isLocalFile &&
    !url.startsWith("libsql:") &&
    !url.startsWith("https:") &&
    !url.startsWith("http:") &&
    !url.startsWith("wss:") &&
    !url.startsWith("ws:")
  ) {
    throw new Error(
      "TURSO_DATABASE_URL must start with libsql://, https://, or file:.",
    );
  }

  return { url, authToken };
}

function createDatabaseClient() {
  const { url, authToken } = databaseConfiguration();
  return createClient({
    url,
    authToken,
    intMode: "number",
    concurrency: 10,
    timeout: 5_000,
  });
}

export function getDatabase() {
  if (!globalForTurso.techsastraTurso) {
    globalForTurso.techsastraTurso = createDatabaseClient();
  }
  return globalForTurso.techsastraTurso;
}

export function rowString(row: Row, key: string) {
  const value = row[key];
  if (typeof value !== "string") {
    throw new Error(`Database column ${key} is not a string.`);
  }
  return value;
}

export function rowNullableString(row: Row, key: string) {
  const value = row[key];
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`Database column ${key} is not a string or null.`);
  }
  return value;
}

export function rowNumber(row: Row, key: string) {
  const value = row[key];
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new Error(`Database column ${key} is not numeric.`);
}

export function rowBoolean(row: Row, key: string) {
  return rowNumber(row, key) !== 0;
}

export function rowDate(row: Row, key: string) {
  const value = row[key];
  const date =
    typeof value === "number" || typeof value === "bigint"
      ? new Date(Number(value))
      : typeof value === "string" && /^\d+$/.test(value)
        ? new Date(Number(value))
        : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Database column ${key} is not a valid date.`);
  }
  return date;
}

export function nowTimestamp() {
  return Date.now();
}
