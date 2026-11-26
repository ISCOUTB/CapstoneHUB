import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { contentDisposition } from '../common/http';
import { MilestoneReportService } from './milestone-report.service';

@Controller('projects')
export class DocumentsController {
  constructor(private readonly milestoneReports: MilestoneReportService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Get(':id/export/milestones/pdf')
  async exportMilestoneReportPdf(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.milestoneReports.exportMilestoneReport(user, id);

    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition(file.fileName),
      'Content-Length': String(file.buffer.length),
    });

    return new StreamableFile(file.buffer);
  }
}
