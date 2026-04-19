import { Project } from '../../domain/project.entity';
import { IProjectRepository } from '../../domain/ports/project.repository.port';
import { ProjectResponseDto } from './create-project.use-case';
import {
  ProjectNotFoundError,
  ProjectPersistenceError,
} from '../../domain/exceptions/project.exceptions';

export class GetProjectByIdUseCase {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(projectId: string): Promise<ProjectResponseDto> {
    try {
      const project = await this.projectRepository.findById(projectId);

      if (!project) {
        throw new ProjectNotFoundError(projectId);
      }

      return this.mapToResponse(project);
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        throw error;
      }
      throw new ProjectPersistenceError('Error getting project', error as Error);
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
