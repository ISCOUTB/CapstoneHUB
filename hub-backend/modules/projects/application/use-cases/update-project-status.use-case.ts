import { Project } from '../../domain/project.entity';
import { ProjectStatus } from '../../domain/project-status.enum';
import { IProjectRepository } from '../../domain/ports/project.repository.port';
import { ProjectResponseDto } from './create-project.use-case';
import {
  ProjectNotFoundError,
  InvalidProjectStatusTransitionError,
  ProjectPersistenceError,
} from '../../domain/exceptions/project.exceptions';

export interface UpdateProjectStatusDto {
  projectId: string;
  newStatus: ProjectStatus;
}

export class UpdateProjectStatusUseCase {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(input: UpdateProjectStatusDto): Promise<ProjectResponseDto> {
    try {
      // Obtener proyecto existente
      const project = await this.projectRepository.findById(input.projectId);

      if (!project) {
        throw new ProjectNotFoundError(input.projectId);
      }

      // Cambiar estado (esto valida transiciones en el dominio)
      try {
        project.changeStatus(input.newStatus);
      } catch (error) {
        throw new InvalidProjectStatusTransitionError(project.status, input.newStatus);
      }

      // Persistir cambios
      await this.projectRepository.update(project);

      return this.mapToResponse(project);
    } catch (error) {
      if (
        error instanceof ProjectNotFoundError ||
        error instanceof InvalidProjectStatusTransitionError
      ) {
        throw error;
      }
      throw new ProjectPersistenceError('Error updating project status', error as Error);
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
