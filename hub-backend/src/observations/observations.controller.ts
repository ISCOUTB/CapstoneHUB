import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProjectObservation } from '../generated/prisma/client';
import { ObservationsService } from './observations.service';

@Controller('projects/:projectId/observations')
export class ObservationsController {
  constructor(private observationsService: ObservationsService) {}

  @Get()
  async getProjectObservations(
    @Param('projectId') projectId: string,
  ): Promise<ProjectObservation[]> {
    return this.observationsService.observationsByProject(Number(projectId));
  }

  @Post()
  async createProjectObservation(
    @Param('projectId') projectId: string,
    @Body() data: { content?: string },
  ): Promise<ProjectObservation> {
    return this.observationsService.createObservation({
      projectId: Number(projectId),
      content: data.content,
    });
  }
}