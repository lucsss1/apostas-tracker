import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const AF = "https://v3.football.api-sports.io";

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  let path: string | null = null;

  if (action === "search") {
    const q = searchParams.get("q");
    if (!q) return NextResponse.json({ error: "missing q" }, { status: 400 });
    path = `/teams?search=${encodeURIComponent(q)}`;
  } else if (action === "fixtures") {
    const teamId = searchParams.get("teamId");
    if (!teamId) return NextResponse.json({ error: "missing teamId" }, { status: 400 });
    path = `/fixtures?team=${encodeURIComponent(teamId)}&last=10&status=FT`;
  } else if (action === "h2h") {
    const t1 = searchParams.get("t1");
    const t2 = searchParams.get("t2");
    if (!t1 || !t2) return NextResponse.json({ error: "missing t1/t2" }, { status: 400 });
    path = `/fixtures/headtohead?h2h=${encodeURIComponent(t1)}-${encodeURIComponent(t2)}&last=8&status=FT`;
  } else {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  try {
    const r = await fetch(AF + path, {
      headers: { "x-apisports-key": process.env.AF_API_KEY! },
    });
    if (!r.ok) {
      return NextResponse.json({ error: "API-Football error" }, { status: r.status });
    }
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "upstream fetch failed" }, { status: 502 });
  }
}
