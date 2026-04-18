import { NextResponse } from "next/server";
import { getAuthedStaff } from "@/lib/auth";

export async function GET() {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ...staff });
}

