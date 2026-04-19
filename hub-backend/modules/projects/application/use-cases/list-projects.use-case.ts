import { Project } from '../../domain/project.entity';
import { IProjectRepository } from '../../domain/ports/project.repository.port';
import { ProjectResponseDto } from './create-project.use-case';
import { ProjectPersistenceError } from '../../domain/exceptions/project.exceptions';

export class ListProjectsUseCase {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(): Promise<ProjectResponseDto[]> {
    try {
      const projects = await this.projectRepository.findAll();
      return projects.map((project) => this.mapToResponse(project));
    } catch (error) {
      throw new ProjectPersistenceError('Error listing projects', error as Error);
    }
  }

  private mapToResponse(project: Project): ProjectResponseDto {
    const props = project.toPrimitives();
    return {
      id: props.id,
      projectCode: props.projectCode,
      name: props.name,
      description: props.description,
      context: props.context,
      type: props.type,
      status: props.status,
      schools: props.schools,
      proposer: props.proposer,
      actors: props.actors,
      startDate: props.startDate,
      endDate: props.endDate,
      estimatedCost: props.estimatedCost,
      observations: props.observations,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
