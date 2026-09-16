import { NextResponse } from "next/server";
import { verifySupabaseConnection } from "@/lib/supabase/verify";

export async function GET() {
  const result = await verifySupabaseConnection();

  return NextResponse.json(
    {
      service: "confirma",
      supabase: {
        configured: result.configured,
        reachable: result.reachable,
        error: result.error ?? null,
      },
    },
    { status: result.reachable ? 200 : 503 },
  );
}
