import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getFlatCategories } from "@/lib/posts";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  const categories = await getFlatCategories();
  return NextResponse.json(categories);
}
