import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { contentDisposition } from '../common/http';
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
} from './attachments.constants';
import { AttachmentsService } from './attachments.service';
import { ProjectAttachmentResponse } from './attachments.select';

@Controller('projects/:projectId/attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get()
  listAttachments(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectAttachmentResponse[]> {
    return this.attachmentsService.attachmentsByProject(projectId, user);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_ATTACHMENT_SIZE_BYTES },
      fileFilter: (_request, file, callback) => {
        if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException(`Unsupported file type: ${file.mimetype}`),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadAttachment(
    @Param('projectId', ParseIntPipe) projectId: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('reportId') reportId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectAttachmentResponse> {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    const parsedReportId =
      reportId === undefined || reportId === '' ? undefined : Number(reportId);

    if (parsedReportId !== undefined && Number.isNaN(parsedReportId)) {
      throw new BadRequestException('reportId must be a number');
    }

    return this.attachmentsService.createAttachment({
      projectId,
      file,
      reportId: parsedReportId,
      user,
    });
  }

  @Get(':attachmentId/download')
  async downloadAttachment(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { attachment, stream } =
      await this.attachmentsService.downloadAttachment({
        projectId,
        attachmentId,
        user,
      });

    response.set({
      'Content-Type': attachment.mimeType,
      'Content-Length': String(attachment.sizeBytes),
      'Content-Disposition': contentDisposition(attachment.originalName),
    });

    return new StreamableFile(stream);
  }

  @Delete(':attachmentId')
  deleteAttachment(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectAttachmentResponse> {
    return this.attachmentsService.deleteAttachment({
      projectId,
      attachmentId,
      user,
    });
  }
}
