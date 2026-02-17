import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Tiebreak } from '@hockey/shared';
import { PrismaService } from '../prisma.service';

function ensureValidId(name: string, value: string) {
  if (!/^[a-zA-Z0-9_-]{3,100}$/.test(value)) {
    throw new BadRequestException(`${name} is invalid`);
  }
}

function ensureValidDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BadRequestException('date must be YYYY-MM-DD');
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new BadRequestException('date must be YYYY-MM-DD');
  }
}

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private prisma: PrismaService) {}

  @Get('home')
  @ApiQuery({ name: 'date', required: true, type: String, example: '2026-05-12' })
  async home(@Query('date') date?: string) {
    if (!date) throw new BadRequestException('date is required');
    ensureValidDate(date);

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const matches = await this.prisma.match.findMany({
      where: {
        kickoffAt: {
          gte: dayStart,
          lte: dayEnd
        }
      },
      orderBy: [{ kickoffAt: 'asc' }, { round: 'asc' }]
    });

    const live = matches.filter((m) => m.homeGoals !== null && m.awayGoals !== null);
    const finalized = matches.filter((m) => m.homeGoals !== null && m.awayGoals !== null);
    const upcoming = matches.filter((m) => m.homeGoals === null || m.awayGoals === null);

    return { data: { date, live, finalized, upcoming } };
  }

  @Get('competitions/:slug/seasons/:seasonId')
  async season(@Param('slug') slug: string, @Param('seasonId') seasonId: string) {
    ensureValidId('slug', slug);
    ensureValidId('seasonId', seasonId);

    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      include: { competition: true, phases: true }
    });
    if (!season || season.competition.slug !== slug) throw new NotFoundException();
    return { data: season };
  }

  @Get('phases/:phaseId/standings')
  async standings(@Param('phaseId') phaseId: string) {
    ensureValidId('phaseId', phaseId);

    const phase = await this.prisma.phase.findUnique({ where: { id: phaseId } });
    if (!phase) throw new NotFoundException();
    const ruleSet = await this.prisma.ruleSet.findUnique({ where: { seasonId: phase.seasonId } });
    const rows = await this.prisma.standingsRow.findMany({ where: { phaseId } });
    const order = ruleSet?.tiebreakOrder || [Tiebreak.POINTS, Tiebreak.GOAL_DIFFERENCE, Tiebreak.GOALS_FOR];

    const sorted = [...rows].sort((a, b) => {
      for (const key of order) {
        const diff =
          key === Tiebreak.POINTS ? b.points - a.points :
          key === Tiebreak.HEAD_TO_HEAD_POINTS ? b.headToHeadPoints - a.headToHeadPoints :
          key === Tiebreak.GOAL_DIFFERENCE ? b.gd - a.gd :
          key === Tiebreak.GOALS_FOR ? b.gf - a.gf : 0;
        if (diff !== 0) return diff;
      }
      return a.teamId.localeCompare(b.teamId);
    });

    return { data: sorted.map((r, i) => ({ ...r, rank: i + 1 })) };
  }

  @Get('phases/:phaseId/matches')
  async matches(@Param('phaseId') phaseId: string) {
    ensureValidId('phaseId', phaseId);

    const phase = await this.prisma.phase.findUnique({ where: { id: phaseId } });
    if (!phase) throw new NotFoundException();
    const matches = await this.prisma.match.findMany({ where: { phaseId }, orderBy: [{ round: 'asc' }] });
    return { data: matches };
  }
}
