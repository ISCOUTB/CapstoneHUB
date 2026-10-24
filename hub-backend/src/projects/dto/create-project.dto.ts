import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
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

  @ApiPropertyOptional({ description: 'detalle del origen del proyecto' })
  @IsOptional()
  @IsString()
  sourceDetails?: string;

  @ApiPropertyOptional({ description: 'fecha de consentimiento de duración' })
  @IsOptional()
  @IsString()
  submissionConsentAt?: string;

  @ApiPropertyOptional({ description: 'área o ingeniería del proyecto' })
  @IsOptional()
  @IsString()
  engineeringArea?: string;

  @ApiPropertyOptional({ description: 'nombre del asesor externo' })
  @IsOptional()
  @IsString()
  externalAdvisorName?: string;

  @ApiPropertyOptional({ description: 'correo del asesor externo' })
  @IsOptional()
  @IsString()
  externalAdvisorEmail?: string;

  @ApiPropertyOptional({ description: 'NIT de la empresa externa' })
  @IsOptional()
  @IsString()
  externalNit?: string;

  @ApiPropertyOptional({ description: 'grupo de investigación' })
  @IsOptional()
  @IsString()
  researchGroup?: string;

  @ApiPropertyOptional({ description: 'Junta de Acción Comunal' })
  @IsOptional()
  @IsString()
  socialOrganization?: string;

  @ApiPropertyOptional({ description: 'NIT de la organización social' })
  @IsOptional()
  @IsString()
  socialNit?: string;

  @ApiPropertyOptional({ description: 'localización del proyecto social' })
  @IsOptional()
  @IsString()
  socialLocation?: string;

  @ApiPropertyOptional({ description: 'alcance específico del proyecto' })
  @IsOptional()
  @IsString()
  projectScope?: string;

  @ApiPropertyOptional({ description: 'disponibilidad de recursos monetarios: yes, no o na' })
  @IsOptional()
  @IsString()
  monetaryResources?: string;

  @ApiPropertyOptional({ description: 'descripción de los recursos monetarios disponibles' })
  @IsOptional()
  @IsString()
  monetaryResourcesDescription?: string;

  @ApiPropertyOptional({ type: [String], description: 'profesores de contacto' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facultyAdvisors?: string[];
}
