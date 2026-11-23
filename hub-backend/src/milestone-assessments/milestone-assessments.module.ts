import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MilestoneAssessmentsController } from './milestone-assessments.controller';
import { MilestoneAssessmentsService } from './milestone-assessments.service';

@Module({
  imports: [AuthModule],
  controllers: [MilestoneAssessmentsController],
  providers: [MilestoneAssessmentsService],
})
export class MilestoneAssessmentsModule {}
