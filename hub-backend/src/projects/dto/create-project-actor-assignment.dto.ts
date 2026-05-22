import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/class-transformer';
import { IsEnum, IsInt, IsNotEmpty, Min } from '@nestjs/class-validator';
import { ActorRole } from '../../generated/prisma/client';

export class CreateProjectActorAssignmentDTO {
  @ApiProperty({ description: 'user identifier' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @ApiProperty({ description: 'role assigned to the user', enum: ActorRole })
  @IsEnum(ActorRole)
  @IsNotEmpty()
  role!: ActorRole;
}
