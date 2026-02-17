import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { Tiebreak } from '@hockey/shared';

describe('Public endpoints (e2e)', () => {
  let app: INestApplication;

  const prismaMock: any = {
    match: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'm1', phaseId: 'phs_123', round: 1, homeGoals: null, awayGoals: null }
      ])
    },
    season: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        if (where.id === 'season_123') return Promise.resolve({ id: 'season_123', competition: { slug: 'liga-demo' }, phases: [{ id: 'phs_123' }] });
        return Promise.resolve(null);
      })
    },
    phase: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        if (where.id === 'phs_123') return Promise.resolve({ id: 'phs_123', seasonId: 'season_123' });
        return Promise.resolve(null);
      })
    },
    ruleSet: {
      findUnique: jest.fn().mockResolvedValue({ tiebreakOrder: [Tiebreak.POINTS, Tiebreak.HEAD_TO_HEAD_POINTS] })
    },
    standingsRow: {
      findMany: jest.fn().mockResolvedValue([
        { id: 's1', teamId: 'A', points: 3, headToHeadPoints: 0, gd: 1, gf: 2 },
        { id: 's2', teamId: 'B', points: 3, headToHeadPoints: 1, gd: 0, gf: 1 }
      ])
    }
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /public/home returns 400 on invalid date', async () => {
    await request(app.getHttpServer()).get('/public/home?date=2026-99-99').expect(400);
  });

  it('GET /public/home returns 200 on valid date', async () => {
    const res = await request(app.getHttpServer()).get('/public/home?date=2026-05-12').expect(200);
    expect(res.body.data.date).toBe('2026-05-12');
    expect(Array.isArray(res.body.data.upcoming)).toBeTruthy();
  });

  it('GET /public/competitions/:slug/seasons/:seasonId returns 200', async () => {
    await request(app.getHttpServer()).get('/public/competitions/liga-demo/seasons/season_123').expect(200);
  });

  it('GET /public/competitions/:slug/seasons/:seasonId returns 404 for missing', async () => {
    await request(app.getHttpServer()).get('/public/competitions/liga-demo/seasons/season_404').expect(404);
  });

  it('GET /public/phases/:phaseId/standings returns sorted data', async () => {
    const res = await request(app.getHttpServer()).get('/public/phases/phs_123/standings').expect(200);
    expect(res.body.data[0].teamId).toBe('B');
  });

  it('GET /public/phases/:phaseId/matches returns 200', async () => {
    const res = await request(app.getHttpServer()).get('/public/phases/phs_123/matches').expect(200);
    expect(Array.isArray(res.body.data)).toBeTruthy();
  });

  it('GET /public/phases/:phaseId/matches returns 404 when phase not found', async () => {
    await request(app.getHttpServer()).get('/public/phases/phs_404/matches').expect(404);
  });
});
