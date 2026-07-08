import { supabase } from "./supabase";

export interface AFTeam {
  team: { id: number; name: string; country: string };
}

export interface AFFixture {
  fixture: { date: string };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
}

export interface TeamStats {
  teamName: string;
  matches: AFFixture[];
  gf: number;
  ga: number;
  w: number;
  l: number;
  dr: number;
  n: number;
}

async function afGet<T>(query: string): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const r = await fetch(`/api/stats?${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!r.ok) throw new Error("API error " + r.status);
  return r.json();
}

export function searchTeams(q: string) {
  return afGet<{ response: AFTeam[] }>(`action=search&q=${encodeURIComponent(q)}`);
}

export function fetchFixtures(teamId: number) {
  return afGet<{ response: AFFixture[] }>(`action=fixtures&teamId=${teamId}`);
}

export function fetchH2H(t1: number, t2: number) {
  return afGet<{ response: AFFixture[] }>(`action=h2h&t1=${t1}&t2=${t2}`);
}

export function buildTeamStats(teamName: string, teamId: number, fixtures: AFFixture[]): TeamStats {
  const matches = fixtures.slice(0, 6);
  let gf = 0,
    ga = 0,
    w = 0,
    l = 0,
    dr = 0;
  matches.forEach((m) => {
    const isHome = m.teams.home.id === teamId;
    const tg = (isHome ? m.goals.home : m.goals.away) || 0;
    const og = (isHome ? m.goals.away : m.goals.home) || 0;
    gf += tg;
    ga += og;
    if (tg > og) w++;
    else if (tg < og) l++;
    else dr++;
  });
  return { teamName, matches, gf, ga, w, l, dr, n: matches.length };
}
