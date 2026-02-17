import { Tiebreak } from '@hockey/shared';
import { PublicController } from '../src/public/public.controller';

describe('public standings sorting', () => {
  it('orders by configured tiebreak order including head-to-head', async () => {
    const prisma: any = {
      phase: { findUnique: jest.fn().mockResolvedValue({ id: 'p1', seasonId: 's1' }) },
      ruleSet: { findUnique: jest.fn().mockResolvedValue({ tiebreakOrder: [Tiebreak.POINTS, Tiebreak.HEAD_TO_HEAD_POINTS, Tiebreak.GOAL_DIFFERENCE] }) },
      standingsRow: {
        findMany: jest.fn().mockResolvedValue([
          { id: '1', teamId: 'A', points: 10, headToHeadPoints: 1, gd: 5, gf: 20 },
          { id: '2', teamId: 'B', points: 10, headToHeadPoints: 4, gd: 1, gf: 10 }
        ])
      }
    };
    const controller = new PublicController(prisma);
    const res = await controller.standings('p1');
    expect(res.data[0].teamId).toBe('B');
    expect(res.data[0].rank).toBe(1);
  });
});
