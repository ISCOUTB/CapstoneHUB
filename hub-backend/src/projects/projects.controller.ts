import { Controller, Get, Post, Body } from '@nestjs/common';
import { CreateProjectDTO } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';
import { Project } from './interfaces/projects.interface';

@Controller('projects')
export class ProjectsController {
  constructor(private projectService: ProjectsService) {}

  @Post()
  async create(@Body() createProjectDto: CreateProjectDTO) {
    this.projectService.create(createProjectDto);
  }

  @Get()
  async findAll(): Promise<Project[]> {
    return this.projectService.findAll();
  }
}
