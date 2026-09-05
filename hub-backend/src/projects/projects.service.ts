import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActorRole,
  Prisma,
  Project,
  ProjectStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma.service';

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    naturalProposer: true;
    legalProposer: true;
    observations: true;
    actorAssignments: {
      include: {
        user: true;
      };
    };
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
  actorAssignments: {
    id: number;
    projectId: number;
    userId: number;
    role: ActorRole;
    assignedAt: Date;
    user: {
      id: number;
      fullName: string;
      email: string;
    };
  }[];
};

export type ProjectActorAssignmentResponse = {
  id: number;
  projectId: number;
  userId: number;
  role: ActorRole;
  assignedAt: Date;
  project: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    fullName: string;
    email: string;
  };
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
    actorAssignments: project.actorAssignments.map((assignment) => ({
      id: assignment.id,
      projectId: assignment.projectId,
      userId: assignment.userId,
      role: assignment.role,
      assignedAt: assignment.assignedAt,
      user: {
        id: assignment.user.id,
        fullName: assignment.user.fullName,
        email: assignment.user.email,
      },
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
        actorAssignments: {
          include: {
            user: true,
          },
        },
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
        actorAssignments: {
          include: {
            user: true,
          },
        },
      },
    });

    return projects.map((project) => mapProjectListResponse(project));
  }

  async createProject(
    data: Prisma.ProjectCreateInput,
  ): Promise<ProjectDetailResponse> {
    try {
      const project = await this.prisma.project.create({
        data,
        include: {
          naturalProposer: true,
          legalProposer: true,
          observations: true,
          actorAssignments: {
            include: {
              user: true,
            },
          },
        },
      });

      return mapProjectDetailResponse(project);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = Array.isArray(error.meta?.target) 
          ? error.meta?.target.join(', ')
          : String(error.meta?.target ?? 'unique field');
        throw new ConflictException(`Duplicate value for a unique field: ${target}`);
      }

      throw error;
    }
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
        actorAssignments: {
          include: {
            user: true,
          },
        },
      },
    });

    return mapProjectDetailResponse(project);
  }

  async deleteProject(where: Prisma.ProjectWhereUniqueInput): Promise<Project> {
    return this.prisma.project.delete({ where });
  }

  async addProjectActorAssignment(params: {
    projectId: number;
    userId: number;
    role: ActorRole;
  }): Promise<ProjectActorAssignmentResponse> {
    const { projectId, userId, role } = params;

    const [project, user, existingAssignment] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, email: true },
      }),
      this.prisma.projectActorAssignment.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      }),
    ]);

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (existingAssignment) {
      throw new ConflictException('User is already assigned to this project');
    }

    const assignment = await this.prisma.projectActorAssignment.create({
      data: {
        role,
        project: {
          connect: { id: projectId },
        },
        user: {
          connect: { id: userId },
        },
      },
      select: {
        id: true,
        projectId: true,
        userId: true,
        role: true,
        assignedAt: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return assignment;
  }
}
