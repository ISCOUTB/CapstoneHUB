import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

function normalizeProgramId(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
}

export class ProjectProgramRequirementDto {
  @ApiProperty({
    description: 'Identificador del programa del catálogo institucional',
    example: 'ingenieria-sistemas-computacion',
  })
  @Transform(({ value }) => normalizeProgramId(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  programId!: string;

  @ApiProperty({
    description: 'Cantidad de estudiantes requeridos para el programa',
    minimum: 1,
    example: 3,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentCount!: number;
}
