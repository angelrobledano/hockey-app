import { LegsMode } from '@hockey/shared';
import { generateRoundRobin } from '../src/league/scheduler';

describe('league scheduler', () => {
  const teams = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];

  it('single leg gives 7 matches/team', () => {
    const schedule = generateRoundRobin(teams, LegsMode.SINGLE_LEG);
    const count: Record<string, number> = {};
    for (const m of schedule) {
      count[m.homeTeamId] = (count[m.homeTeamId] || 0) + 1;
      count[m.awayTeamId] = (count[m.awayTeamId] || 0) + 1;
    }
    expect(schedule.length).toBe(28);
    for (const t of teams) expect(count[t]).toBe(7);
  });

  it('double leg doubles with flipped home/away', () => {
    const single = generateRoundRobin(teams, LegsMode.SINGLE_LEG);
    const dbl = generateRoundRobin(teams, LegsMode.DOUBLE_LEG);
    expect(dbl.length).toBe(single.length * 2);
    const pairs = new Set(single.map((m) => `${m.homeTeamId}-${m.awayTeamId}`));
    for (const m of single) {
      expect(dbl.some((x) => x.homeTeamId === m.awayTeamId && x.awayTeamId === m.homeTeamId)).toBeTruthy();
    }
    expect(pairs.size).toBe(single.length);
  });

  it('does not generate identical duplicate matches', () => {
    const schedule = generateRoundRobin(teams, LegsMode.DOUBLE_LEG);
    const ids = schedule.map((m) => `${m.round}-${m.homeTeamId}-${m.awayTeamId}`);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
