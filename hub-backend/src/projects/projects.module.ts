import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectExportsService } from './project-exports.service';
import { ProjectsService } from './projects.service';
import { AuthModule } from '../auth/auth.module';
import { EvaluationsModule } from '../evaluations/evaluations.module';

@Module({
  imports: [AuthModule, EvaluationsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectExportsService],
})
export class ProjectsModule {}
