import { Injectable } from '@nestjs/common';
import { Project } from '../../domain/project.entity';
import { IProjectRepository } from '../../domain/ports/project.repository.port';
import { ProjectActorRole, ProposerType } from '../../domain/project.types';

@Injectable()
export class InMemoryProjectRepository implements IProjectRepository {
  private readonly projects = new Map<string, Project>();

  async save(project: Project): Promise<void> {
    this.projects.set(project.id, Project.rehydrate(project.toPrimitives()));
  }

  async update(project: Project): Promise<void> {
    this.projects.set(project.id, Project.rehydrate(project.toPrimitives()));
  }

  async findById(id: string): Promise<Project | null> {
    const project = this.projects.get(id);
    return project ? Project.rehydrate(project.toPrimitives()) : null;
  }

  async findByCode(code: string): Promise<Project | null> {
    for (const project of this.projects.values()) {
      if (project.projectCode === code) {
        return Project.rehydrate(project.toPrimitives());
      }
    }
    return null;
  }

  async findAll(): Promise<Project[]> {
    return [...this.projects.values()].map((project) =>
      Project.rehydrate(project.toPrimitives()),
    );
  }

  async findByStatus(status: string): Promise<Project[]> {
    return [...this.projects.values()]
      .filter((project) => project.status === status)
      .map((project) => Project.rehydrate(project.toPrimitives()));
  }

  async findBySchool(school: string): Promise<Project[]> {
    return [...this.projects.values()]
      .filter((project) => project.schools.includes(school))
      .map((project) => Project.rehydrate(project.toPrimitives()));
  }

  async findByType(type: string): Promise<Project[]> {
    return [...this.projects.values()]
      .filter((project) => project.type === type)
      .map((project) => Project.rehydrate(project.toPrimitives()));
  }

  async findByProposerType(type: ProposerType): Promise<Project[]> {
    return [...this.projects.values()]
      .filter((project) => project.proposer.type === type)
      .map((project) => Project.rehydrate(project.toPrimitives()));
  }

  async findByActorId(actorId: string): Promise<Project[]> {
    return [...this.projects.values()]
      .filter((project) => project.actors.some((actor) => actor.actorId === actorId))
      .map((project) => Project.rehydrate(project.toPrimitives()));
  }

  async findByActorRole(role: ProjectActorRole): Promise<Project[]> {
    return [...this.projects.values()]
      .filter((project) => project.actors.some((actor) => actor.role === role))
      .map((project) => Project.rehydrate(project.toPrimitives()));
  }

  async delete(id: string): Promise<void> {
    this.projects.delete(id);
  }

  async existsByCode(code: string): Promise<boolean> {
    for (const project of this.projects.values()) {
      if (project.projectCode === code) {
        return true;
      }
    }
    return false;
  }

  async existsById(id: string): Promise<boolean> {
    return this.projects.has(id);
  }
}
