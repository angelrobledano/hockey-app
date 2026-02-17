import { Tiebreak } from '@hockey/shared';
import { ConflictException } from '@nestjs/common';
import { AdminService } from '../src/admin/admin.service';

describe('admin service sprint1 acceptance', () => {
  it('rejects non rink hockey sport', () => {
    const service = new AdminService({} as any);
    expect(() => service.createCompetition({ name: 'x', slug: 'x', sport: 'OTHER' as any })).toThrow();
  });

  it('accepts limited tiebreak catalog', async () => {
    const prisma: any = {
      season: { findUnique: jest.fn().mockResolvedValue({ id: 's1' }) },
      ruleSet: { upsert: jest.fn().mockResolvedValue({ id: 'r1' }) }
    };
    const service = new AdminService(prisma);
    await expect(service.upsertRuleSet('s1', {
      pointsWin: 3, pointsDraw: 1, pointsLoss: 0,
      tiebreakOrder: [Tiebreak.POINTS, Tiebreak.GOALS_FOR]
    })).resolves.toBeTruthy();
  });

  it('category defaults to 2x25', async () => {
    const prisma: any = {
      season: { findUnique: jest.fn().mockResolvedValue({ id: 's1' }) },
      category: { create: jest.fn().mockResolvedValue({ periodsCount: 2, periodMinutes: 25 }) }
    };
    const service = new AdminService(prisma);
    await service.createCategory('s1', { name: 'U17' });
    expect(prisma.category.create).toHaveBeenCalledWith({ data: { seasonId: 's1', name: 'U17', periodsCount: 2, periodMinutes: 25 } });
  });

  it('assignment conflict when same team repeated in payload', async () => {
    const prisma: any = {
      season: { findUnique: jest.fn().mockResolvedValue({ id: 's1' }) },
      seasonTeam: {
        findUnique: jest.fn().mockResolvedValue(null),
        createMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([])
      }
    };
    const service = new AdminService(prisma);
    await expect(service.assignTeams('s1', { teams: [{ teamId: 't1' }, { teamId: 't1' }] })).rejects.toBeInstanceOf(ConflictException);
  });
});
