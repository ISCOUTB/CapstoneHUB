import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  ObservationsService,
  ProjectObservationResponse,
} from './observations.service';

@Controller('projects/:projectId/observations')
export class ObservationsController {
  constructor(private observationsService: ObservationsService) {}

  @Get()
  async getProjectObservations(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectObservationResponse[]> {
    return this.observationsService.observationsByProject(
      Number(projectId),
      user,
    );
  }

  @Post()
  async createProjectObservation(
    @Param('projectId') projectId: string,
    @Body() data: { content?: string },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectObservationResponse> {
    return this.observationsService.createObservation({
      projectId: Number(projectId),
      content: data.content,
      user,
    });
  }
}
