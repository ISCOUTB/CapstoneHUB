import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
} from 'class-validator';
import { ProjectPhase } from '../generated/prisma/client';

export class CreateMilestoneDto {
  @ApiProperty({ description: 'Milestone title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Milestone description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Milestone due date',
    type: String,
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate()
  dueDate!: Date;

  @ApiPropertyOptional({ description: 'Whether the milestone is completed' })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @ApiPropertyOptional({
    description:
      'Whether the milestone is a minimum milestone required to advance the project phase or close it',
  })
  @IsBoolean()
  @IsOptional()
  isMinimum?: boolean;

  @ApiPropertyOptional({
    enum: ProjectPhase,
    description:
      'Semester phase the milestone belongs to (defaults to the project current phase)',
  })
  @IsEnum(ProjectPhase)
  @IsOptional()
  phase?: ProjectPhase;

  @ApiPropertyOptional({
    description: 'Reports (deliveries) linked to this milestone',
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  reportIds?: number[];
}

export class UpdateMilestoneDto {
  @ApiPropertyOptional({ description: 'Milestone title' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Milestone description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Milestone due date',
    type: String,
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Whether the milestone is completed' })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @ApiPropertyOptional({
    description:
      'Whether the milestone is a minimum milestone required to advance the project phase or close it',
  })
  @IsBoolean()
  @IsOptional()
  isMinimum?: boolean;

  @ApiPropertyOptional({
    enum: ProjectPhase,
    description: 'Semester phase the milestone belongs to',
  })
  @IsEnum(ProjectPhase)
  @IsOptional()
  phase?: ProjectPhase;

  @ApiPropertyOptional({
    description: 'Reports (deliveries) linked to this milestone',
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  reportIds?: number[];
}

export class SaveMilestoneRubricDto {
  @ApiProperty({ description: 'Answers keyed by rubric item identifier' })
  @IsObject()
  answers!: Record<string, unknown>;
}
