import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  BadRequestException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import {
  Project as ProjectModel,
  ProjectStatus,
} from '../generated/prisma/client';

@Controller('projects')
export class ProjectsController {
  constructor(private projectService: ProjectsService) {}

  @Get(':id')
  async getProjectById(@Param('id') id: string): Promise<ProjectModel | null> {
    return this.projectService.project({ id: Number(id) });
  }

  @Get()
  async getProjects(): Promise<ProjectModel[]> {
    return this.projectService.projects({});
  }

  @Post()
  async createProject(
    @Body()
    projectData: {
      name: string;
      description: string;
      context: string;
    },
  ): Promise<ProjectModel> {
    const { name, description, context } = projectData;
    const startDate = new Date();
    return this.projectService.createProject({
      name,
      description,
      context,
      startDate,
    });
  }

  @Put(':id')
  async projectUpdate(
    @Param('id') id: string,
    @Body()
    data: {
      newName?: string;
      status?: ProjectStatus;
    },
  ): Promise<ProjectModel> {
    const updateData: {
      name?: string;
      status?: ProjectStatus;
    } = {};

    if (data.newName) {
      updateData.name = data.newName;
    }

    if (data.status) {
      updateData.status = data.status;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No update fields provided');
    }

    return this.projectService.updateProject({
      where: { id: Number(id) },
      data: updateData,
    });
  }

  @Delete(':id')
  async deleteProject(@Param('id') id: string): Promise<ProjectModel> {
    return this.projectService.deleteProject({ id: Number(id) });
  }
}
