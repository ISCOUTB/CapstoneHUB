import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from '@nestjs/class-validator';

export class UpdateProjectDTO {
  @ApiPropertyOptional({ description: 'nombre del proyecto' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'descripcion del proyecto' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  description?: string;
}
