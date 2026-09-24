import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Put,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalCurrentUser } from '../auth/optional-current-user.decorator';
import { Public } from '../auth/public.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ProjectsService } from './projects.service';
import {
  Project as ProjectModel,
  ProjectSource,
  ProjectStatus,
} from '../generated/prisma/client';
import {
  AssignableUserResponse,
  ProjectActorAssignmentResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  MyProjectResponse,
} from './projects.service';
import { CreateProjectActorAssignmentDTO } from './dto/create-project-actor-assignment.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private projectService: ProjectsService) {}

  @Get('mine')
  @UseGuards(AuthGuard)
  async getMyProjects(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MyProjectResponse[]> {
    return this.projectService.projectsForUser(user);
  }

  @Public()
  @Get(':id')
  async getProjectById(
    @Param('id') id: string,
    @OptionalCurrentUser() user?: AuthenticatedUser,
  ): Promise<ProjectDetailResponse> {
    const project = await this.projectService.project({ id: Number(id) }, user);

    if (!project) {
      // El proyecto no existe o el espectador no puede verlo. Respondemos 404
      // en ambos casos para no revelar la existencia de proyectos privados.
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  @Public()
  @Get()
  async getProjects(
    @OptionalCurrentUser() user?: AuthenticatedUser,
  ): Promise<ProjectListResponse[]> {
    return this.projectService.projects({}, user);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createProject(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    projectData: {
      name: string;
      description: string;
      context: string;
      namep: string;
      ncedua?: string;
      correo: string;
      estimatedCost?: number;
      location?: string;
      startDate?: string;
      requiresLegalization?: boolean;
      isPrivate?: boolean;
      source?: ProjectSource;
      facultyAdvisor?: string;
      teamRequirements?: string;
      expectedOutcomes?: string;
      deliverables?: string[];
    },
  ): Promise<ProjectDetailResponse> {
    const {
      name,
      description,
      context,
      namep,
      ncedua,
      correo,
      estimatedCost,
      location,
      startDate,
      requiresLegalization,
      isPrivate,
      source,
      facultyAdvisor,
      teamRequirements,
      expectedOutcomes,
      deliverables,
    } = projectData;

    const parsedStartDate = startDate
      ? new Date(`${startDate}T00:00:00`)
      : null;

    if (parsedStartDate && Number.isNaN(parsedStartDate.getTime())) {
      throw new BadRequestException('Invalid start date');
    }

    const deliverableDescriptions = (deliverables ?? [])
      .map((deliverable) => deliverable.trim())
      .filter((deliverable) => deliverable.length > 0);

    return this.projectService.createProject(user, {
      name,
      description,
      context,
      startDate: parsedStartDate,
      estimatedCost,
      location,
      requiresLegalization: requiresLegalization ?? false,
      isPrivate: isPrivate ?? true,
      source: source ?? ProjectSource.external_entity,
      facultyAdvisor: facultyAdvisor?.trim() || null,
      teamRequirements: teamRequirements?.trim() || null,
      expectedOutcomes: expectedOutcomes?.trim() || null,
      deliverables: deliverableDescriptions.length
        ? {
            create: deliverableDescriptions.map((description) => ({
              description,
            })),
          }
        : undefined,
      naturalProposer: {
        create: {
          fullName: namep,
          idNumber: ncedua?.trim() || null,
          email: correo,
        },
      },
    });
  }

  @Get(':id/assignable-users')
  @UseGuards(AuthGuard)
  async getAssignableUsers(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AssignableUserResponse[]> {
    return this.projectService.assignableUsers(user, Number(id));
  }

  @Post(':id/actors')
  @UseGuards(AuthGuard)
  async addProjectActorAssignment(
    @Param('id') id: string,
    @Body() assignmentData: CreateProjectActorAssignmentDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectActorAssignmentResponse> {
    return this.projectService.addProjectActorAssignment({
      user,
      projectId: Number(id),
      userId: assignmentData.userId,
      role: assignmentData.role,
    });
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async projectUpdate(
    @Param('id') id: string,
    @Body()
    data: {
      newName?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectDetailResponse> {
    const updateData: { name?: string } = {};

    if (data.newName) {
      updateData.name = data.newName;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No update fields provided');
    }

    return this.projectService.updateProject({
      user,
      where: { id: Number(id) },
      data: updateData,
    });
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard)
  async transitionProjectStatus(
    @Param('id') id: string,
    @Body() data: { status: ProjectStatus; description?: string },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectDetailResponse> {
    if (!data.status) {
      throw new BadRequestException('A target status is required');
    }

    return this.projectService.transitionProjectStatus({
      user,
      projectId: Number(id),
      nextStatus: data.status,
      description: data.description,
    });
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteProject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectModel> {
    return this.projectService.deleteProject(user, { id: Number(id) });
  }
}
