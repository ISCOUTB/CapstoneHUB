import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  MilestonesService,
  ProjectMilestoneResponse,
} from './milestones.service';
import { CreateMilestoneDto, SaveMilestoneRubricDto, UpdateMilestoneDto } from './milestones.dto';

@Controller('projects/:projectId/milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Get()
  getProjectMilestones(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectMilestoneResponse[]> {
    return this.milestonesService.milestonesByProject(projectId, user);
  }

  @Get('rubrics')
  getProjectRubrics(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.milestonesService.rubricsByProject(projectId, user);
  }

  @Put('rubrics/:programId')
  saveProjectRubric(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('programId') programId: string,
    @Body() data: SaveMilestoneRubricDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.milestonesService.saveProjectRubric({ projectId, programId, answers: data.answers, user });
  }

  @Post()
  createProjectMilestone(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() data: CreateMilestoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectMilestoneResponse> {
    return this.milestonesService.createMilestone({
      projectId,
      data,
      user,
    });
  }

  @Patch(':milestoneId')
  updateProjectMilestone(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
    @Body() data: UpdateMilestoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectMilestoneResponse> {
    return this.milestonesService.updateMilestone({
      projectId,
      milestoneId,
      data,
      user,
    });
  }

  @Delete(':milestoneId')
  deleteProjectMilestone(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectMilestoneResponse> {
    return this.milestonesService.deleteMilestone({
      projectId,
      milestoneId,
      user,
    });
  }
}
