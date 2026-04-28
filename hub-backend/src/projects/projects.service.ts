import { Injectable } from '@nestjs/common';
import { Project } from './interfaces/projects.interface';

@Injectable()
export class ProjectsService {
  private readonly projects: Project[] = [];

  create(cat: Project) {
    this.projects.push(cat);
  }

  findAll(): Project[] {
    return this.projects;
  }
}
