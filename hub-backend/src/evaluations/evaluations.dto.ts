import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProjectEvaluationCriterionDto {
  @ApiProperty({ description: 'Id del criterio de la rúbrica' })
  @IsInt()
  @Min(1)
  criterionId!: number;

  @ApiProperty({
    description: 'Nota del criterio entre 0.0 y 5.0',
    minimum: 0,
    maximum: 5,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(5)
  score!: number;

  @ApiProperty({
    description: 'Comentario opcional del criterio',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  comment?: string;
}

export class SaveProjectEvaluationDto {
  @ApiProperty({ type: [ProjectEvaluationCriterionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ProjectEvaluationCriterionDto)
  criteria!: ProjectEvaluationCriterionDto[];

  @ApiProperty({
    description: 'Comentario general opcional de la evaluación',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  generalComment?: string;
}
