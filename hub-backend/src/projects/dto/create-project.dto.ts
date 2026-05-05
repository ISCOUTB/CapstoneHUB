import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from '@nestjs/class-validator';

export class CreateProjectDTO {
  @ApiProperty({ description: 'nombre del proyecto' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'descripcion del proyecto' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
