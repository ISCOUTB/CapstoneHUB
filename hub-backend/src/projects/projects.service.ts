import { Injectable, NotFoundException } from '@nestjs/common';
import { Project } from './interfaces/projects.interface';

@Injectable()
export class ProjectsService {
  private readonly projects: Project[] = [];

  create(project: Project): Project {
    this.projects.push(project);
    return project;
  }

  findAll(): Project[] {
    return this.projects;
  }

  findById(id: string): Project {
    const index = this.getIndex(id);
    return this.projects[index];
  }

  updateById(id: string, update: Partial<Project>): Project {
    const index = this.getIndex(id);
    const updatedProject = {
      ...this.projects[index],
      ...update,
    };

    this.projects[index] = updatedProject;
    return updatedProject;
  }

  deleteById(id: string): Project {
    const index = this.getIndex(id);
    const [deletedProject] = this.projects.splice(index, 1);
    return deletedProject;
  }

  private getIndex(id: string): number {
    const index = Number.parseInt(id, 10);

    if (
      Number.isNaN(index) ||
      index < 0 ||
      index >= this.projects.length
    ) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    return index;
  }
}
