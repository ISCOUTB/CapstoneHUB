import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class SaveMilestoneAssessmentDto {
  @ApiProperty({ description: 'Answers keyed by milestone assessment item id' })
  @IsObject()
  answers!: Record<string, unknown>;
}
