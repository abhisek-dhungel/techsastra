import { Prisma } from "@prisma/client";

export type DatabaseErrorDetails = {
  code: string;
  message: string;
  status: number;
};

function errorCode(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return error.errorCode || "DATABASE_INITIALIZATION_FAILED";
  }
  return null;
}

export function describeDatabaseError(error: unknown): DatabaseErrorDetails {
  const code = errorCode(error);

  switch (code) {
    case "P1000":
      return {
        code,
        message: "The database rejected its username or password.",
        status: 503,
      };
    case "P1001":
    case "P1002":
    case "P1017":
      return {
        code,
        message:
          "The database is unreachable. Check the Railway public TCP URL and service status.",
        status: 503,
      };
    case "P1003":
      return {
        code,
        message: "The database named in DATABASE_URL does not exist.",
        status: 503,
      };
    case "P2002":
      return {
        code,
        message: "A record with the same unique value already exists.",
        status: 409,
      };
    case "P2000":
      return {
        code,
        message: "One of the submitted values is too long for the database.",
        status: 400,
      };
    case "P2003":
    case "P2025":
      return {
        code,
        message:
          "The selected category or related record no longer exists. Reload the admin page and try again.",
        status: 400,
      };
    case "P2021":
    case "P2022":
      return {
        code,
        message:
          "The production database schema is out of date. Redeploy the latest commit to apply migrations.",
        status: 503,
      };
    case "P2024":
      return {
        code,
        message:
          "The database connection pool is busy. Please wait a moment and try again.",
        status: 503,
      };
    default:
      return {
        code: code || "DATABASE_REQUEST_FAILED",
        message: "The database request failed. Check the Vercel runtime log.",
        status: 500,
      };
  }
}

function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/mysql:\/\/[^\s@]+@/gi, "mysql://[REDACTED]@");
}

export function logDatabaseError(context: string, error: unknown) {
  const details = describeDatabaseError(error);
  console.error(`[database] ${context} (${details.code}): ${safeErrorMessage(error)}`);
  return details;
}
