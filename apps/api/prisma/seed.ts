import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const competition = await prisma.competition.upsert({
    where: { slug: 'liga-demo' },
    update: {},
    create: { name: 'Liga Demo', slug: 'liga-demo', sport: 'RINK_HOCKEY' }
  });
  const season = await prisma.season.create({ data: { competitionId: competition.id, name: '2026' } });
  const phase = await prisma.phase.create({ data: { seasonId: season.id, phaseType: 'LEAGUE' } });
  const teams = await Promise.all(Array.from({ length: 8 }, (_, i) => prisma.team.create({ data: { name: `Team ${i + 1}` } })));
  await prisma.seasonTeam.createMany({ data: teams.map((t, i) => ({ seasonId: season.id, teamId: t.id, seed: i + 1 })) });
  await prisma.category.create({ data: { seasonId: season.id, name: 'Senior', periodsCount: 2, periodMinutes: 25 } });
  await prisma.ruleSet.create({ data: { seasonId: season.id, pointsWin: 3, pointsDraw: 1, pointsLoss: 0, tiebreakOrder: ['POINTS', 'HEAD_TO_HEAD_POINTS', 'GOAL_DIFFERENCE', 'GOALS_FOR'] } });
  console.log({ competitionId: competition.id, seasonId: season.id, phaseId: phase.id });
}

main().finally(() => prisma.$disconnect());
