import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
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
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportResponse[]> {
    return this.reportsService.reportsByProject(Number(projectId), user);
  }

  @Post()
  createProjectReport(
    @Param('projectId') projectId: string,
    @Body() data: CreateReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportResponse> {
    return this.reportsService.createReport({
      projectId: Number(projectId),
      data,
      user,
    });
  }

  @Patch(':reportId')
  updateProjectReport(
    @Param('projectId') projectId: string,
    @Param('reportId') reportId: string,
    @Body() data: UpdateReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportResponse> {
    return this.reportsService.updateReport({
      projectId: Number(projectId),
      reportId: Number(reportId),
      data,
      user,
    });
  }

  @Delete(':reportId')
  deleteProjectReport(
    @Param('projectId') projectId: string,
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportResponse> {
    return this.reportsService.deleteReport({
      projectId: Number(projectId),
      reportId: Number(reportId),
      user,
    });
  }

  @Post(':reportId/submit')
  submitProjectReport(
    @Param('projectId') projectId: string,
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportResponse> {
    return this.reportsService.submitReport({
      projectId: Number(projectId),
      reportId: Number(reportId),
      user,
    });
  }

  @Post(':reportId/review')
  reviewProjectReport(
    @Param('projectId') projectId: string,
    @Param('reportId') reportId: string,
    @Body() data: ReviewReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportResponse> {
    return this.reportsService.reviewReport({
      projectId: Number(projectId),
      reportId: Number(reportId),
      data,
      user,
    });
  }

  @Post(':reportId/contents')
  createReportContent(
    @Param('projectId') projectId: string,
    @Param('reportId') reportId: string,
    @Body() data: CreateReportContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportContentResponse> {
    return this.reportsService.createContent({
      projectId: Number(projectId),
      reportId: Number(reportId),
      data,
      user,
    });
  }

  @Post(':reportId/contents/files/presign')
  presignReportContentFile(
    @Param('projectId') projectId: string,
    @Param('reportId') reportId: string,
    @Body() data: PresignReportFileContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportFileUploadTarget> {
    return this.reportsService.presignFileContent({
      projectId: Number(projectId),
      reportId: Number(reportId),
      data,
      user,
    });
  }

  @Post(':reportId/contents/files/confirm')
  confirmReportContentFile(
    @Param('projectId') projectId: string,
    @Param('reportId') reportId: string,
    @Body() data: ConfirmReportFileContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportContentResponse> {
    return this.reportsService.confirmFileContent({
      projectId: Number(projectId),
      reportId: Number(reportId),
      data,
      user,
    });
  }

  @Patch(':reportId/contents/:contentId')
  updateReportContent(
    @Param('projectId') projectId: string,
    @Param('reportId') reportId: string,
    @Param('contentId') contentId: string,
    @Body() data: UpdateReportContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectReportContentResponse> {
    return this.reportsService.updateContent({
      projectId: Number(projectId),
      reportId: Number(reportId),
      contentId: Number(contentId),
      data,
      user,
    });
  }

  @Delete(':reportId/contents/:contentId')
  deleteReportContent(
    @Param('projectId') projectId: string,
    @Param('reportId') reportId: string,
    @Param('contentId') contentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ id: number }> {
    return this.reportsService.deleteContent({
      projectId: Number(projectId),
      reportId: Number(reportId),
      contentId: Number(contentId),
      user,
    });
  }

  @Get(':reportId/contents/:contentId/stream')
  async streamReportContent(
    @Param('projectId') projectId: string,
    @Param('reportId') reportId: string,
    @Param('contentId') contentId: string,
    @Headers('range') rangeHeader: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const result = await this.reportsService.openContentStream({
      projectId: Number(projectId),
      reportId: Number(reportId),
      contentId: Number(contentId),
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
