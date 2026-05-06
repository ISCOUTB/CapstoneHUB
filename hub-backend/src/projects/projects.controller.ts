import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project as ProjectModel } from '../generated/prisma/client';

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
      projectCode: string;
      context: string;
    },
  ): Promise<ProjectModel> {
    const { name, description, projectCode, context } = projectData;
    const startDate = new Date();
    return this.projectService.createProject({
      name,
      description,
      projectCode,
      context,
      startDate,
    });
  }

  @Put(':id')
  async projectUpdateName(
    @Param('id') id: string,
    @Body() data: { newName: string },
  ): Promise<ProjectModel> {
    const { newName } = data;
    return this.projectService.updateProject({
      where: { id: Number(id) },
      data: { name: newName },
    });
  }

  @Delete(':id')
  async deleteProject(@Param('id') id: string): Promise<ProjectModel> {
    return this.projectService.deleteProject({ id: Number(id) });
  }
}
