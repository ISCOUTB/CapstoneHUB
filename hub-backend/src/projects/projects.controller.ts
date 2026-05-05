import { Controller, Get, Post, Patch, Body, Param, Delete } from '@nestjs/common';
import { CreateProjectDTO } from './dto/create-project.dto';
import { UpdateProjectDTO } from './dto/update-project.dto';
import { ResponseProjectDTO } from './dto/response-project.dto';
import { ResponseProjectByIdDTO } from './dto/response-project-by-id.dto';
import { ResponseProjectDeleteDTO } from './dto/response-project-delete.dto';
import { ResponseProjectUpdateDTO } from './dto/response-project-update.dto';
import { ProjectsService } from './projects.service';
import { Project } from './interfaces/projects.interface';

@Controller('projects')
export class ProjectsController {
  constructor(private projectService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDTO): ResponseProjectDTO {
    const createdProject = this.projectService.create(createProjectDto);

    return {
      count: 1,
      message: 'item creado con exito',
      data: [createdProject],
    };
  }

  @Get()
  async findAll(): Promise<Project[]> {
    return this.projectService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string): ResponseProjectByIdDTO {
    const project = this.projectService.findById(id);

    return {
      count: 1,
      message: 'item encontrado con exito',
      data: [project],
    };
  }

  @Patch(':id')
  updateById(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDTO,
  ): ResponseProjectUpdateDTO {
    const updatedProject = this.projectService.updateById(
      id,
      updateProjectDto,
    );

    return {
      count: 1,
      message: 'item actualizado con exito',
      data: [updatedProject],
    };
  }

  @Delete(':id')
  deleteById(@Param('id') id: string): ResponseProjectDeleteDTO {
    const deletedProject = this.projectService.deleteById(id);

    return {
      count: 1,
      message: 'item eliminado con exito',
      data: [deletedProject],
    };
  }
}
