import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  MilestoneAssessmentsService,
  ProjectMilestoneAssessmentResponse,
} from './milestone-assessments.service';
import { SaveMilestoneAssessmentDto } from './milestone-assessments.dto';

@Controller('projects/:projectId/milestone-assessments')
export class MilestoneAssessmentsController {
  constructor(
    private readonly milestoneAssessments: MilestoneAssessmentsService,
  ) {}

  @Get()
  getProjectMilestoneAssessments(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectMilestoneAssessmentResponse[]> {
    return this.milestoneAssessments.assessmentsByProject(projectId, user);
  }

  @Put(':programId')
  saveProjectMilestoneAssessment(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('programId') programId: string,
    @Body() data: SaveMilestoneAssessmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectMilestoneAssessmentResponse> {
    return this.milestoneAssessments.saveAssessment({
      projectId,
      programId,
      answers: data.answers,
      user,
    });
  }
}
