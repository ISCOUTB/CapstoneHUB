import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ProjectPhase } from '../generated/prisma/client';
import {
  AssignRubricTemplateDto,
  CreateRubricTemplateDto,
  UpdateRubricTemplateDto,
} from './rubrics.dto';
import { RubricTemplateResponse, RubricsService } from './rubrics.service';

@Controller('rubrics')
export class RubricsController {
  constructor(private readonly rubricsService: RubricsService) {}

  @Get('templates')
  templates(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RubricTemplateResponse[]> {
    return this.rubricsService.templates(user);
  }

  @Get('templates/:id')
  template(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RubricTemplateResponse> {
    return this.rubricsService.template(user, id);
  }

  @Post('templates')
  createTemplate(
    @Body() data: CreateRubricTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RubricTemplateResponse> {
    return this.rubricsService.createTemplate(user, data);
  }

  @Patch('templates/:id')
  updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateRubricTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RubricTemplateResponse> {
    return this.rubricsService.updateTemplate(user, id, data);
  }

  @Patch('templates/:id/archive')
  archiveTemplate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RubricTemplateResponse> {
    return this.rubricsService.archiveTemplate(user, id);
  }
}

@Controller('projects/:projectId/rubric-assignments')
export class ProjectRubricAssignmentsController {
  constructor(private readonly rubricsService: RubricsService) {}

  @Put(':phase')
  assignTemplate(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('phase', new ParseEnumPipe(ProjectPhase)) phase: ProjectPhase,
    @Body() data: AssignRubricTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RubricTemplateResponse> {
    return this.rubricsService.assignTemplate({
      user,
      projectId,
      phase,
      rubricTemplateId: data.rubricTemplateId,
    });
  }

  @Delete(':phase')
  clearTemplate(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('phase', new ParseEnumPipe(ProjectPhase)) phase: ProjectPhase,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RubricTemplateResponse> {
    return this.rubricsService.clearTemplate({ user, projectId, phase });
  }
}
