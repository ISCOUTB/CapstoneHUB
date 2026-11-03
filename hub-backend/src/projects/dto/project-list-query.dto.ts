import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ProjectSource, ProjectStatus } from '../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/pagination.dto';
import {
  PROJECT_PROGRAM_IDS,
  PROJECT_SCHOOL_IDS,
} from '../project-programs.constants';

export const PROJECT_SORT_VALUES = [
  'relevance',
  'name-asc',
  'name-desc',
  'year-desc',
  'year-asc',
] as const;

export type ProjectSort = (typeof PROJECT_SORT_VALUES)[number];

function toArray(value: unknown): unknown[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return Array.isArray(value) ? (value as unknown[]) : [value];
}

function trimOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalBoolean(value: unknown): unknown {
  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return value;
}

function toYearArray(value: unknown): number[] | undefined {
  return toArray(value)?.map(Number);
}

function toStringArray(value: unknown): string[] | undefined {
  const values = toArray(value)
    ?.map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter(
      (item): item is string => typeof item === 'string' && item.length > 0,
    );

  return values?.length ? values : undefined;
}

/** Filtros y orden del listado de proyectos. */
export class ProjectListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Búsqueda por nombre, descripción, contexto, ubicación o proponente',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  @MaxLength(120)
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Estados del proyecto (se puede repetir)',
    enum: ProjectStatus,
    isArray: true,
  })
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @IsEnum(ProjectStatus, { each: true })
  @IsOptional()
  status?: ProjectStatus[];

  @ApiPropertyOptional({
    description: 'Nombres exactos de proponentes (se puede repetir)',
    isArray: true,
    type: String,
  })
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  @IsOptional()
  proposer?: string[];

  @ApiPropertyOptional({
    description: 'Fuentes del proyecto (se puede repetir)',
    enum: ProjectSource,
    isArray: true,
  })
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @IsEnum(ProjectSource, { each: true })
  @IsOptional()
  source?: ProjectSource[];

  @ApiPropertyOptional({
    description: 'Identificadores de escuelas (se puede repetir)',
    enum: PROJECT_SCHOOL_IDS,
    isArray: true,
    type: String,
  })
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsIn(PROJECT_SCHOOL_IDS, { each: true })
  @IsOptional()
  schoolId?: string[];

  @ApiPropertyOptional({
    description: 'Identificadores de programas (se puede repetir)',
    enum: PROJECT_PROGRAM_IDS,
    isArray: true,
    type: String,
  })
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsIn(PROJECT_PROGRAM_IDS, { each: true })
  @IsOptional()
  programId?: string[];

  @ApiPropertyOptional({ description: 'Requiere proceso de legalización' })
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  @IsOptional()
  requiresLegalization?: boolean;

  @ApiPropertyOptional({
    description: 'Años de inicio (se puede repetir)',
    isArray: true,
    type: Number,
  })
  @Transform(({ value }) => toYearArray(value))
  @IsArray()
  @IsInt({ each: true })
  @Min(1900, { each: true })
  @Max(2100, { each: true })
  @IsOptional()
  year?: number[];

  @ApiPropertyOptional({
    description: 'Incluye proyectos sin fecha de inicio',
  })
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  @IsOptional()
  withoutYear?: boolean;

  @ApiPropertyOptional({
    description: 'Solo proyectos asignados al usuario actual',
  })
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  @IsOptional()
  assignedToMe?: boolean;

  @ApiPropertyOptional({
    description: 'Solo proyectos propuestos por el usuario actual',
  })
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  @IsOptional()
  proposedByMe?: boolean;

  @ApiPropertyOptional({ description: 'Solo proyectos con equipo asignado' })
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  @IsOptional()
  hasTeam?: boolean;

  @ApiPropertyOptional({ description: 'Solo proyectos privados' })
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Orden del listado',
    enum: PROJECT_SORT_VALUES,
  })
  @IsIn(PROJECT_SORT_VALUES)
  @IsOptional()
  sort?: ProjectSort;
}
