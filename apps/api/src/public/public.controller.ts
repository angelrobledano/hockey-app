import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Tiebreak } from '@hockey/shared';
import { PrismaService } from '../prisma.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private prisma: PrismaService) {}

  @Get('competitions/:slug/seasons/:seasonId')
  async season(@Param('slug') slug: string, @Param('seasonId') seasonId: string) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId }, include: { competition: true, phases: true } });
    if (!season || season.competition.slug !== slug) throw new NotFoundException();
    return season;
  }

  @Get('phases/:phaseId/standings')
  async standings(@Param('phaseId') phaseId: string) {
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

    return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
  }

  @Get('phases/:phaseId/matches')
  async matches(@Param('phaseId') phaseId: string) {
    return this.prisma.match.findMany({ where: { phaseId }, orderBy: [{ round: 'asc' }] });
  }
}
