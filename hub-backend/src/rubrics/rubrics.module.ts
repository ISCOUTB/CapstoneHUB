import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  ProjectRubricAssignmentsController,
  RubricsController,
} from './rubrics.controller';
import { RubricsService } from './rubrics.service';

@Module({
  imports: [AuthModule],
  controllers: [RubricsController, ProjectRubricAssignmentsController],
  providers: [RubricsService],
  exports: [RubricsService],
})
export class RubricsModule {}
