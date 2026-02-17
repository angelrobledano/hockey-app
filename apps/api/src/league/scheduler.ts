import { LegsMode } from '@hockey/shared';

export type Pair = { homeTeamId: string; awayTeamId: string; round: number };

export function generateRoundRobin(teamIds: string[], legsMode: LegsMode): Pair[] {
  if (teamIds.length < 2 || teamIds.length % 2 !== 0) throw new Error('Even number >=2 required');
  const teams = [...teamIds];
  const rounds = teams.length - 1;
  const half = teams.length / 2;
  const matches: Pair[] = [];

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const home = teams[i];
      const away = teams[teams.length - 1 - i];
      matches.push({ homeTeamId: home, awayTeamId: away, round: r + 1 });
    }
    teams.splice(1, 0, teams.pop()!);
  }

  if (legsMode === LegsMode.DOUBLE_LEG) {
    const secondLeg = matches.map((m) => ({
      homeTeamId: m.awayTeamId,
      awayTeamId: m.homeTeamId,
      round: m.round + rounds
    }));
    return [...matches, ...secondLeg];
  }

  return matches;
}
