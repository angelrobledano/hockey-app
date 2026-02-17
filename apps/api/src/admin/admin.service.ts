import { LegsMode, PhaseType, Sport, Tiebreak } from '@hockey/shared';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { generateRoundRobin } from '../league/scheduler';
import { AssignTeamsDto, CreateTeamDto, CreateCategoryDto, CreateCompetitionDto, CreateSeasonDto, GenerateLeagueDto, RuleSetDto } from '../dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  createTeam(dto: CreateTeamDto) {
    return this.prisma.team.create({ data: { name: dto.name } });
  }

  createCompetition(dto: CreateCompetitionDto) {
    if (dto.sport !== Sport.RINK_HOCKEY) throw new BadRequestException('Only RINK_HOCKEY allowed');
    return this.prisma.competition.create({ data: dto });
  }

  async createSeason(dto: CreateSeasonDto) {
    const competition = await this.prisma.competition.findUnique({ where: { id: dto.competitionId } });
    if (!competition) throw new NotFoundException('Competition not found');
    const season = await this.prisma.season.create({ data: { competitionId: dto.competitionId, name: dto.name } });
    const phase = await this.prisma.phase.create({ data: { seasonId: season.id, phaseType: PhaseType.LEAGUE as any } });
    return { season, phase };
  }

  async assignTeams(seasonId: string, dto: AssignTeamsDto) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) throw new NotFoundException('Season not found');
    if (!dto.teams.length) throw new BadRequestException('teams is required');

    const seen = new Set<string>();
    for (const team of dto.teams) {
      if (seen.has(team.teamId)) throw new ConflictException(`Duplicate team in payload: ${team.teamId}`);
      seen.add(team.teamId);
      const exists = await this.prisma.seasonTeam.findUnique({ where: { seasonId_teamId: { seasonId, teamId: team.teamId } } });
      if (exists) throw new ConflictException(`Team already assigned: ${team.teamId}`);
    }

    await this.prisma.seasonTeam.createMany({ data: dto.teams.map((t) => ({ seasonId, teamId: t.teamId, seed: t.seed })), skipDuplicates: true });
    return this.prisma.seasonTeam.findMany({ where: { seasonId } });
  }

  async upsertRuleSet(seasonId: string, dto: RuleSetDto) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) throw new NotFoundException('Season not found');
    if (dto.tiebreakOrder.some((t) => !Object.values(Tiebreak).includes(t))) throw new BadRequestException('Invalid tiebreak');
    return this.prisma.ruleSet.upsert({ where: { seasonId }, update: dto as any, create: { seasonId, ...(dto as any) } });
  }

  async createCategory(seasonId: string, dto: CreateCategoryDto) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) throw new NotFoundException('Season not found');
    return this.prisma.category.create({ data: { seasonId, name: dto.name, periodsCount: dto.periodsCount ?? 2, periodMinutes: dto.periodMinutes ?? 25 } });
  }

  async generateLeague(phaseId: string, dto: GenerateLeagueDto) {
    const phase = await this.prisma.phase.findUnique({ where: { id: phaseId } });
    if (!phase) throw new NotFoundException('Phase not found');
    const seasonTeams = await this.prisma.seasonTeam.findMany({ where: { seasonId: phase.seasonId } });
    const teamIds = seasonTeams.map((s) => s.teamId);
    if (teamIds.length % 2 !== 0) throw new BadRequestException('Even number of teams required');

    const schedule = generateRoundRobin(teamIds, dto.legsMode as LegsMode);
    const unique = new Set(schedule.map((s) => `${s.round}-${s.homeTeamId}-${s.awayTeamId}`));
    if (unique.size !== schedule.length) throw new ConflictException('Duplicate matches generated');

    await this.prisma.leagueSettings.upsert({ where: { phaseId }, update: { legsMode: dto.legsMode as any }, create: { phaseId, legsMode: dto.legsMode as any } });
    await this.prisma.match.deleteMany({ where: { phaseId } });
    await this.prisma.match.createMany({ data: schedule.map((m) => ({ ...m, phaseId })) });
    return this.prisma.match.findMany({ where: { phaseId }, orderBy: [{ round: 'asc' }] });
  }
}
