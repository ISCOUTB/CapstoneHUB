import { Injectable } from '@nestjs/common';
import { Prisma, Project, ProjectStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma.service';

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    naturalProposer: true;
    legalProposer: true;
    observations: true;
  };
}>;

export type ProjectProposerResponse =
  | {
      type: 'natural_person';
      fullName: string;
      idNumber: string;
      email: string;
    }
  | {
      type: 'legal_person';
      legalName: string;
      nit: string;
      email: string;
      phone: string;
      contactUrl: string | null;
    };

export type ProjectListResponse = {
  id: number;
  name: string;
  status: ProjectStatus;
  proposer: ProjectProposerResponse | null;
  actors: unknown[];
};

export type ProjectDetailResponse = ProjectListResponse & {
  description: string;
  context: string;
  startDate: Date;
  endDate: Date | null;
  estimatedCost: Prisma.Decimal | null;
  createdAt: Date;
  updatedAt: Date;
  observations: {
    id: number;
    projectId: number;
    content: string;
    createdAt: Date;
  }[];
};

function mapProjectProposer(
  project: Pick<ProjectWithRelations, 'naturalProposer' | 'legalProposer'>,
): ProjectProposerResponse | null {
  if (project.naturalProposer) {
    return {
      type: 'natural_person',
      fullName: project.naturalProposer.fullName,
      idNumber: project.naturalProposer.idNumber,
      email: project.naturalProposer.email,
    };
  }

  if (project.legalProposer) {
    return {
      type: 'legal_person',
      legalName: project.legalProposer.legalName,
      nit: project.legalProposer.nit,
      email: project.legalProposer.email,
      phone: project.legalProposer.phone,
      contactUrl: project.legalProposer.contactUrl,
    };
  }

  return null;
}

function mapProjectListResponse(
  project: ProjectWithRelations,
): ProjectListResponse {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    proposer: mapProjectProposer(project),
    actors: [],
  };
}

function mapProjectDetailResponse(
  project: ProjectWithRelations,
): ProjectDetailResponse {
  return {
    ...mapProjectListResponse(project),
    description: project.description,
    context: project.context,
    startDate: project.startDate,
    endDate: project.endDate,
    estimatedCost: project.estimatedCost,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    observations: project.observations.map((observation) => ({
      id: observation.id,
      projectId: observation.projectId,
      content: observation.content,
      createdAt: observation.createdAt,
    })),
  };
}

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async project(
    projectWhereUniqueInput: Prisma.ProjectWhereUniqueInput,
  ): Promise<ProjectDetailResponse | null> {
    const project = await this.prisma.project.findUnique({
      where: projectWhereUniqueInput,
      include: {
        naturalProposer: true,
        legalProposer: true,
        observations: true,
      },
    });

    return project ? mapProjectDetailResponse(project) : null;
  }

  async projects(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ProjectWhereUniqueInput;
    where?: Prisma.ProjectWhereInput;
    orderBy?: Prisma.ProjectOrderByWithRelationInput;
  }): Promise<ProjectListResponse[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const projects = await this.prisma.project.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        naturalProposer: true,
        legalProposer: true,
        observations: true,
      },
    });

    return projects.map((project) => mapProjectListResponse(project));
  }

  async createProject(
    data: Prisma.ProjectCreateInput,
  ): Promise<ProjectDetailResponse> {
    const project = await this.prisma.project.create({
      data,
      include: {
        naturalProposer: true,
        legalProposer: true,
        observations: true,
      },
    });

    return mapProjectDetailResponse(project);
  }

  async updateProject(params: {
    where: Prisma.ProjectWhereUniqueInput;
    data: Prisma.ProjectUpdateInput;
  }): Promise<ProjectDetailResponse> {
    const { where, data } = params;
    const project = await this.prisma.project.update({
      data,
      where,
      include: {
        naturalProposer: true,
        legalProposer: true,
        observations: true,
      },
    });

    return mapProjectDetailResponse(project);
  }

  async deleteProject(where: Prisma.ProjectWhereUniqueInput): Promise<Project> {
    return this.prisma.project.delete({ where });
  }
}
