import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { DocumentsController } from './documents.controller';
import { MilestoneReportService } from './milestone-report.service';

@Module({
  imports: [AuthModule, ProjectsModule],
  controllers: [DocumentsController],
  providers: [MilestoneReportService],
})
export class DocumentsModule {}
