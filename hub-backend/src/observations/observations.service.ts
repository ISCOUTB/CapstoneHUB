import { BadRequestException, Injectable } from '@nestjs/common';
import { ProjectObservation } from '../generated/prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ObservationsService {
  constructor(private prisma: PrismaService) {}

  async observationsByProject(projectId: number): Promise<ProjectObservation[]> {
    return this.prisma.projectObservation.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createObservation(params: {
    projectId: number;
    content?: string;
  }): Promise<ProjectObservation> {
    const content = params.content?.trim();

    if (!content) {
      throw new BadRequestException('Observation content is required');
    }

    return this.prisma.projectObservation.create({
      data: {
        content,
        project: {
          connect: { id: params.projectId },
        },
      },
    });
  }
}