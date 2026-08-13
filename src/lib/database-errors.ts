import { LibsqlError } from "@libsql/client";
import { TursoConfigurationError } from "./turso";

export type DatabaseErrorDetails = {
  code: string;
  message: string;
  status: number;
};

function errorCode(error: unknown) {
  if (error instanceof TursoConfigurationError) {
    return "TURSO_NOT_CONFIGURED";
  }
  if (error instanceof LibsqlError) {
    return error.extendedCode || error.code || "LIBSQL_ERROR";
  }
  return null;
}

function rawErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function isUniqueDatabaseError(error: unknown) {
  const code = errorCode(error);
  const message = rawErrorMessage(error).toLowerCase();
  return (
    code === "SQLITE_CONSTRAINT_UNIQUE" ||
    code === "SQLITE_CONSTRAINT_PRIMARYKEY" ||
    message.includes("unique constraint failed")
  );
}

export function describeDatabaseError(error: unknown): DatabaseErrorDetails {
  const code = errorCode(error);
  const message = rawErrorMessage(error).toLowerCase();

  if (error instanceof TursoConfigurationError) {
    return {
      code: "TURSO_NOT_CONFIGURED",
      message: `Database access is not configured. Add ${error.missingVariables.join(", ")} in Vercel and redeploy.`,
      status: 503,
    };
  }

  if (isUniqueDatabaseError(error)) {
    return {
      code: code || "SQLITE_CONSTRAINT_UNIQUE",
      message: "A record with the same unique value already exists.",
      status: 409,
    };
  }

  if (
    code === "SQLITE_CONSTRAINT_FOREIGNKEY" ||
    message.includes("foreign key constraint failed")
  ) {
    return {
      code: code || "SQLITE_CONSTRAINT_FOREIGNKEY",
      message:
        "The selected category or related record no longer exists. Reload the admin page and try again.",
      status: 400,
    };
  }

  if (
    code === "SQLITE_BUSY" ||
    code === "SQLITE_LOCKED" ||
    message.includes("database is locked")
  ) {
    return {
      code: code || "SQLITE_BUSY",
      message: "The database is busy. Please wait a moment and try again.",
      status: 503,
    };
  }

  if (
    message.includes("no such table") ||
    message.includes("no such column")
  ) {
    return {
      code: code || "TURSO_SCHEMA_OUTDATED",
      message:
        "The Turso schema is out of date. Redeploy the latest commit to apply migrations.",
      status: 503,
    };
  }

  if (
    message.includes("unauthorized") ||
    message.includes("authentication") ||
    message.includes("jwt")
  ) {
    return {
      code: code || "TURSO_AUTHENTICATION_FAILED",
      message: "Turso rejected the database authentication token.",
      status: 503,
    };
  }

  if (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("websocket") ||
    message.includes("connection")
  ) {
    return {
      code: code || "TURSO_UNREACHABLE",
      message: "Turso is unreachable. Check the database URL and service status.",
      status: 503,
    };
  }

  return {
    code: code || "DATABASE_REQUEST_FAILED",
    message: "The database request failed. Check the Vercel runtime log.",
    status: 500,
  };
}

function safeErrorMessage(error: unknown) {
  const message = rawErrorMessage(error);
  return message
    .replace(/(libsql|https?):\/\/[^\s/@]+:[^\s/@]+@/gi, "$1://[REDACTED]@")
    .replace(/eyJ[A-Za-z0-9._-]+/g, "[REDACTED_TOKEN]");
}

export function logDatabaseError(context: string, error: unknown) {
  const details = describeDatabaseError(error);
  console.error(
    `[database] ${context} (${details.code}): ${safeErrorMessage(error)}`,
  );
  return details;
}
