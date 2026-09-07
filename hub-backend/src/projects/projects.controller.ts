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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ProjectsService } from './projects.service';
import {
  Project as ProjectModel,
  ProjectStatus,
} from '../generated/prisma/client';
import {
  ProjectActorAssignmentResponse,
  ProjectDetailResponse,
  ProjectListResponse,
} from './projects.service';
import { CreateProjectActorAssignmentDTO } from './dto/create-project-actor-assignment.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private projectService: ProjectsService) {}

  @Get(':id')
  async getProjectById(
    @Param('id') id: string,
  ): Promise<ProjectDetailResponse | null> {
    return this.projectService.project({ id: Number(id) });
  }

  @Get()
  async getProjects(): Promise<ProjectListResponse[]> {
    return this.projectService.projects({});
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
      ncedua: string;
      correo: string;
    },
  ): Promise<ProjectDetailResponse> {
    const { name, description, context, namep, ncedua, correo } = projectData;
    const startDate = new Date();
    return this.projectService.createProject(user, {
      name,
      description,
      context,
      startDate,
      naturalProposer: {
        create: {
          fullName: namep,
          idNumber: ncedua,
          email: correo,
        },
      },
    });
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
