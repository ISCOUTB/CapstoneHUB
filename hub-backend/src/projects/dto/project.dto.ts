import { ApiProperty } from '@nestjs/swagger';

export class ProjectDTO {
  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;
}
