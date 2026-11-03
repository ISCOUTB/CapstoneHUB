import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ProjectSource } from '../../generated/prisma/client';
import { ProjectProgramRequirementDto } from './project-program-requirement.dto';

/**
 * Campos editables del proyecto. El proponente (datos de la persona natural)
 * no se edita aquí: proviene de quien propuso el proyecto.
 */
export class UpdateProjectDTO {
  @ApiPropertyOptional({ description: 'nombre del proyecto' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'descripcion del proyecto' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'justificacion o contexto' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  context?: string;

  @ApiPropertyOptional({
    description: 'ubicacion del proyecto',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  location?: string | null;

  @ApiPropertyOptional({
    description: 'fuente del proyecto',
    enum: ProjectSource,
  })
  @IsEnum(ProjectSource)
  @IsOptional()
  source?: ProjectSource;

  @ApiPropertyOptional({
    description: 'fecha de inicio (YYYY-MM-DD)',
    type: String,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  startDate?: string | null;

  @ApiPropertyOptional({
    description: 'fecha de finalizacion (YYYY-MM-DD)',
    type: String,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  endDate?: string | null;

  @ApiPropertyOptional({ description: 'costo estimado', nullable: true })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  estimatedCost?: number | null;

  @ApiPropertyOptional({ description: 'requiere legalizacion' })
  @IsBoolean()
  @IsOptional()
  requiresLegalization?: boolean;

  @ApiPropertyOptional({ description: 'proyecto privado' })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiPropertyOptional({ description: 'asesor de la facultad', nullable: true })
  @IsString()
  @IsOptional()
  facultyAdvisor?: string | null;

  @ApiPropertyOptional({ description: 'equipo requerido', nullable: true })
  @IsString()
  @IsOptional()
  teamRequirements?: string | null;

  @ApiPropertyOptional({
    description: 'expectativas al finalizar',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  expectedOutcomes?: string | null;

  @ApiPropertyOptional({
    description: 'entregables del proyecto',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  deliverables?: string[];

  @ApiPropertyOptional({
    type: [ProjectProgramRequirementDto],
    description: 'Reemplaza los programas y cantidades requeridos del proyecto',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectProgramRequirementDto)
  programRequirements?: ProjectProgramRequirementDto[];
}
