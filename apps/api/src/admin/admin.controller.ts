import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AssignTeamsDto, CreateCategoryDto, CreateCompetitionDto, CreateSeasonDto, CreateTeamDto, GenerateLeagueDto, RuleSetDto } from '../dto/admin.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Post('competitions') createCompetition(@Body() dto: CreateCompetitionDto) { return this.service.createCompetition(dto); }
  @Post('teams') createTeam(@Body() dto: CreateTeamDto) { return this.service.createTeam(dto); }
  @Post('seasons') createSeason(@Body() dto: CreateSeasonDto) { return this.service.createSeason(dto); }
  @Post('seasons/:seasonId/teams:assign') assignTeams(@Param('seasonId') seasonId: string, @Body() dto: AssignTeamsDto) { return this.service.assignTeams(seasonId, dto); }
  @Put('seasons/:seasonId/rules') rules(@Param('seasonId') seasonId: string, @Body() dto: RuleSetDto) { return this.service.upsertRuleSet(seasonId, dto); }
  @Post('seasons/:seasonId/categories') category(@Param('seasonId') seasonId: string, @Body() dto: CreateCategoryDto) { return this.service.createCategory(seasonId, dto); }
  @Post('phases/:phaseId/league/generate') generate(@Param('phaseId') phaseId: string, @Body() dto: GenerateLeagueDto) { return this.service.generateLeague(phaseId, dto); }
}
