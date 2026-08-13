import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { logDatabaseError } from "@/lib/database-errors";
import { listFlatCategories } from "@/lib/database";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  try {
    const categories = await listFlatCategories();
    return NextResponse.json(categories);
  } catch (reason) {
    const details = logDatabaseError("list categories", reason);
    return NextResponse.json(
      { error: details.message, code: details.code },
      { status: details.status },
    );
  }
}
