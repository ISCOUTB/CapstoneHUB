import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from '@nestjs/class-validator';
import { ProjectSource } from '../../generated/prisma/client';

export class CreateProjectDto {
  @ApiProperty({ description: 'nombre del proyecto' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'descripción del proyecto' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'contexto o justificación del proyecto' })
  @IsString()
  @IsNotEmpty()
  context!: string;

  @ApiProperty({ description: 'nombre del proponente' })
  @IsString()
  @IsNotEmpty()
  namep!: string;

  @ApiPropertyOptional({
    description: 'número de identificación del proponente',
  })
  @IsOptional()
  @IsString()
  ncedua?: string;

  @ApiProperty({ description: 'correo del proponente' })
  @IsString()
  @IsNotEmpty()
  correo!: string;

  @ApiPropertyOptional({ description: 'costo estimado' })
  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @ApiPropertyOptional({ description: 'ubicación' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'fecha de inicio (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'requiere legalización' })
  @IsOptional()
  @IsBoolean()
  requiresLegalization?: boolean;

  @ApiPropertyOptional({ description: 'proyecto privado' })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    enum: ProjectSource,
    description: 'origen del proyecto',
  })
  @IsOptional()
  @IsEnum(ProjectSource)
  source?: ProjectSource;

  @ApiPropertyOptional({ description: 'asesor de facultad' })
  @IsOptional()
  @IsString()
  facultyAdvisor?: string;

  @ApiPropertyOptional({ description: 'requerimientos de equipo' })
  @IsOptional()
  @IsString()
  teamRequirements?: string;

  @ApiPropertyOptional({ description: 'resultados esperados' })
  @IsOptional()
  @IsString()
  expectedOutcomes?: string;

  @ApiPropertyOptional({ type: [String], description: 'entregables' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliverables?: string[];
}
