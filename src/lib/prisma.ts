import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function runtimeDatabaseUrl() {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) {
    throw new Error(
      "DATABASE_URL is missing. Add Railway's public MySQL URL to this deployment.",
    );
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.");
  }

  if (url.protocol !== "mysql:") {
    throw new Error("DATABASE_URL must start with mysql://.");
  }

  if (
    process.env.VERCEL &&
    (url.hostname === "railway.internal" ||
      url.hostname.endsWith(".railway.internal"))
  ) {
    throw new Error(
      "Vercel cannot use Railway's private hostname. Use the public MySQL TCP proxy URL.",
    );
  }

  // Each Vercel function instance owns a Prisma pool. Keep that pool deliberately
  // small so concurrent serverless instances cannot exhaust Railway MySQL.
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "1");
  }
  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", "20");
  }
  if (!url.searchParams.has("connect_timeout")) {
    url.searchParams.set("connect_timeout", "10");
  }

  return url.toString();
}

function createPrismaClient() {
  return new PrismaClient({
    datasourceUrl: runtimeDatabaseUrl(),
    errorFormat: "minimal",
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    transactionOptions: {
      maxWait: 5_000,
      timeout: 10_000,
    },
  });
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
