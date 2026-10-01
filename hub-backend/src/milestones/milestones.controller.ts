import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { MilestonesService, SelectedMilestone } from './milestones.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './milestones.dto';

@Controller('projects/:projectId/milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Get()
  getProjectMilestones(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SelectedMilestone[]> {
    return this.milestonesService.milestonesByProject(projectId, user);
  }

  @Post()
  createProjectMilestone(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() data: CreateMilestoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SelectedMilestone> {
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
  ): Promise<SelectedMilestone> {
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
  ): Promise<SelectedMilestone> {
    return this.milestonesService.deleteMilestone({
      projectId,
      milestoneId,
      user,
    });
  }
}
