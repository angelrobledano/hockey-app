import { LegsMode, Sport, Tiebreak } from '@hockey/shared';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class CreateCompetitionDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() slug!: string;
  @ApiProperty({ enum: Sport }) @IsEnum(Sport) sport!: Sport;
}

export class CreateTeamDto {
  @ApiProperty() @IsString() name!: string;
}

export class CreateSeasonDto {
  @ApiProperty() @IsString() competitionId!: string;
  @ApiProperty() @IsString() name!: string;
}

export class AssignTeamItemDto {
  @ApiProperty() @IsString() teamId!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() seed?: number;
}

export class AssignTeamsDto {
  @ApiProperty({ type: [AssignTeamItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => AssignTeamItemDto) teams!: AssignTeamItemDto[];
}

export class RuleSetDto {
  @ApiProperty() @IsInt() pointsWin!: number;
  @ApiProperty() @IsInt() pointsDraw!: number;
  @ApiProperty() @IsInt() pointsLoss!: number;
  @ApiProperty({ enum: Tiebreak, isArray: true }) @IsArray() @ArrayNotEmpty() @IsEnum(Tiebreak, { each: true }) tiebreakOrder!: Tiebreak[];
}

export class CreateCategoryDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ required: false, default: 2 }) @IsOptional() @IsInt() @Min(1) periodsCount?: number;
  @ApiProperty({ required: false, default: 25 }) @IsOptional() @IsInt() @Min(1) periodMinutes?: number;
}

export class GenerateLeagueDto {
  @ApiProperty({ enum: LegsMode }) @IsEnum(LegsMode) legsMode!: LegsMode;
}
