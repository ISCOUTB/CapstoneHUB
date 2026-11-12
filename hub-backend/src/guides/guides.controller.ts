import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
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
import { Public } from '../auth/public.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { contentDisposition } from '../common/http';
import {
  GUIDE_DOCUMENT_MIME_TYPES,
  MAX_GUIDE_FILE_SIZE_BYTES,
} from './guides.constants';
import { CreateGuideDocumentDto, UpdateGuideDocumentDto } from './guides.dto';
import { GuideDocumentResponse } from './guides.select';
import { GuidesService } from './guides.service';

@Controller('guides')
export class GuidesController {
  constructor(private readonly guidesService: GuidesService) {}

  @Public()
  @Get('documents')
  documents(): Promise<GuideDocumentResponse[]> {
    return this.guidesService.listPublished();
  }

  @Get('admin/documents')
  adminDocuments(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GuideDocumentResponse[]> {
    return this.guidesService.listAll(user);
  }

  @Public()
  @Get('documents/:id')
  document(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GuideDocumentResponse> {
    return this.guidesService.findPublished(id);
  }

  @Get('admin/documents/:id')
  adminDocument(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GuideDocumentResponse> {
    return this.guidesService.findForAdmin(user, id);
  }

  @Post('documents')
  createDocument(
    @Body() data: CreateGuideDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GuideDocumentResponse> {
    return this.guidesService.create(user, data);
  }

  @Patch('documents/:id')
  updateDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateGuideDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GuideDocumentResponse> {
    return this.guidesService.update(user, id, data);
  }

  @Post('documents/:id/file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_GUIDE_FILE_SIZE_BYTES },
      fileFilter: (_request, file, callback) => {
        if (!GUIDE_DOCUMENT_MIME_TYPES.has(file.mimetype)) {
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
  uploadDocumentFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GuideDocumentResponse> {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    return this.guidesService.uploadFile(user, id, file);
  }

  @Delete('documents/:id/file')
  removeDocumentFile(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GuideDocumentResponse> {
    return this.guidesService.removeFile(user, id);
  }

  @Public()
  @Get('documents/:id/download')
  async downloadDocument(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { document, stream } = await this.guidesService.download(user, id);
    const headers: Record<string, string> = {
      'Content-Type': document.mimeType ?? 'application/octet-stream',
      'Content-Disposition': contentDisposition(
        document.originalName ?? 'documento',
      ),
    };

    if (document.sizeBytes !== null) {
      headers['Content-Length'] = String(document.sizeBytes);
    }

    response.set(headers);

    return new StreamableFile(stream);
  }

  @Delete('documents/:id')
  @HttpCode(204)
  removeDocument(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.guidesService.remove(user, id);
  }
}
