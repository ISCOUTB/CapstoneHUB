import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ProjectPhase } from '../generated/prisma/client';
import { SaveProjectEvaluationDto } from './evaluations.dto';
import {
  EvaluationsService,
  ProjectEvaluationsResponse,
} from './evaluations.service';

@Controller('projects/:projectId/evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Get()
  projectEvaluations(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectEvaluationsResponse> {
    return this.evaluationsService.listProjectEvaluations(user, projectId);
  }

  @Put(':phase')
  saveEvaluation(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('phase', new ParseEnumPipe(ProjectPhase)) phase: ProjectPhase,
    @Body() data: SaveProjectEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectEvaluationsResponse> {
    return this.evaluationsService.saveEvaluation({
      user,
      projectId,
      phase,
      data,
    });
  }
}
