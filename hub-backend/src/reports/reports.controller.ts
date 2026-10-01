import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { contentDisposition, normalizeRangeHeader } from '../common/http';
import {
  ConfirmReportFileContentDto,
  CreateReportContentDto,
  CreateReportDto,
  PresignReportFileContentDto,
  ReviewReportDto,
  UpdateReportContentDto,
  UpdateReportDto,
} from './reports.dto';
import { ProjectReportContentResponse } from './reports.select';
import {
  ProjectReportResponse,
  ReportFileUploadTarget,
  ReportsService,
} from './reports.service';

@Controller('projects/:projectId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  getProjectReports(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportResponse[]> {
    return this.reportsService.reportsByProject(projectId, user);
  }

  @Post()
  createProjectReport(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() data: CreateReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportResponse> {
    return this.reportsService.createReport({
      projectId,
      data,
      user,
    });
  }

  @Patch(':reportId')
  updateProjectReport(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body() data: UpdateReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportResponse> {
    return this.reportsService.updateReport({
      projectId,
      reportId,
      data,
      user,
    });
  }

  @Delete(':reportId')
  deleteProjectReport(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportResponse> {
    return this.reportsService.deleteReport({
      projectId,
      reportId,
      user,
    });
  }

  @Post(':reportId/submit')
  submitProjectReport(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportResponse> {
    return this.reportsService.submitReport({
      projectId,
      reportId,
      user,
    });
  }

  @Post(':reportId/review')
  reviewProjectReport(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body() data: ReviewReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportResponse> {
    return this.reportsService.reviewReport({
      projectId,
      reportId,
      data,
      user,
    });
  }

  @Post(':reportId/contents')
  createReportContent(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body() data: CreateReportContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportContentResponse> {
    return this.reportsService.createContent({
      projectId,
      reportId,
      data,
      user,
    });
  }

  @Post(':reportId/contents/files/presign')
  presignReportContentFile(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body() data: PresignReportFileContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportFileUploadTarget> {
    return this.reportsService.presignFileContent({
      projectId,
      reportId,
      data,
      user,
    });
  }

  @Post(':reportId/contents/files/confirm')
  confirmReportContentFile(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body() data: ConfirmReportFileContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportContentResponse> {
    return this.reportsService.confirmFileContent({
      projectId,
      reportId,
      data,
      user,
    });
  }

  @Patch(':reportId/contents/:contentId')
  updateReportContent(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @Param('contentId', ParseIntPipe) contentId: number,
    @Body() data: UpdateReportContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportContentResponse> {
    return this.reportsService.updateContent({
      projectId,
      reportId,
      contentId,
      data,
      user,
    });
  }

  @Delete(':reportId/contents/:contentId')
  deleteReportContent(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @Param('contentId', ParseIntPipe) contentId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ id: number }> {
    return this.reportsService.deleteContent({
      projectId,
      reportId,
      contentId,
      user,
    });
  }

  @Get(':reportId/contents/:contentId/stream')
  async streamReportContent(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @Param('contentId', ParseIntPipe) contentId: number,
    @Headers('range') rangeHeader: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const result = await this.reportsService.openContentStream({
      projectId,
      reportId,
      contentId,
      range: normalizeRangeHeader(rangeHeader),
      user,
    });

    response.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': contentDisposition(result.fileName, 'inline'),
      'Accept-Ranges': 'bytes',
    });

    if (result.contentLength !== undefined) {
      response.set('Content-Length', String(result.contentLength));
    }

    if (result.contentRange) {
      response.status(206);
      response.set('Content-Range', result.contentRange);
    }

    return new StreamableFile(result.stream);
  }
}
