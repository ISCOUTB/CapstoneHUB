import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RubricCriterionDto {
  @ApiProperty({ description: 'Título del criterio', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    description: 'Descripción opcional del criterio',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiProperty({
    description: 'Porcentaje que aporta el criterio a la nota final',
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  weightPercent!: number;
}

export class CreateRubricTemplateDto {
  @ApiProperty({ description: 'Nombre de la plantilla', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Descripción opcional', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiProperty({
    description: 'Área a la que aplica la rúbrica (opcional)',
    required: false,
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  area?: string;

  @ApiProperty({ type: [RubricCriterionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => RubricCriterionDto)
  criteria!: RubricCriterionDto[];
}

export class UpdateRubricTemplateDto extends PartialType(
  CreateRubricTemplateDto,
) {}

export class AssignRubricTemplateDto {
  @ApiProperty({ description: 'Plantilla de rúbrica activa' })
  @IsInt()
  @Min(1)
  rubricTemplateId!: number;
}
