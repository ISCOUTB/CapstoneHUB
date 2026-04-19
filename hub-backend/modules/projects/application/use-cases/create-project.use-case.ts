import { Project } from '../../domain/project.entity';
import { ProjectType } from '../../domain/project-type.enum';
import { IProjectRepository } from '../../domain/ports/project.repository.port';
import { ProjectActor, ProjectProposer } from '../../domain/project.types';
import {
  DuplicateActorRoleAssignmentError,
  InvalidProposerError,
  ProjectCodeAlreadyExistsError,
  ProjectPersistenceError,
} from '../../domain/exceptions/project.exceptions';

export interface CreateProjectDto {
  projectCode: string;
  name: string;
  description: string;
  context: string;
  type: ProjectType;
  schools: string[];
  proposer: ProjectProposer;
  actors?: ProjectActor[];
  startDate: Date;
  estimatedCost?: number;
}

export interface ProjectResponseDto {
  id: string;
  projectCode: string;
  name: string;
  description: string;
  context: string;
  type: ProjectType;
  status: string;
  schools: string[];
  proposer: ProjectProposer;
  actors: ProjectActor[];
  startDate: Date;
  endDate?: Date;
  estimatedCost?: number;
  observations: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class CreateProjectUseCase {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(input: CreateProjectDto): Promise<ProjectResponseDto> {
    try {
      // Validar que no exista un proyecto con el mismo código
      const existingProject = await this.projectRepository.findByCode(input.projectCode);
      if (existingProject) {
        throw new ProjectCodeAlreadyExistsError(input.projectCode);
      }

      // Crear la entidad de dominio
      const project = Project.create({
        id: this.generateId(),
        projectCode: input.projectCode,
        name: input.name,
        description: input.description,
        context: input.context,
        type: input.type,
        schools: input.schools,
        proposer: input.proposer,
        actors: input.actors,
        startDate: input.startDate,
        estimatedCost: input.estimatedCost,
      });

      // Persistir
      await this.projectRepository.save(project);

      // Retornar DTO
      return this.mapToResponse(project);
    } catch (error) {
      if (
        error instanceof ProjectCodeAlreadyExistsError ||
        error instanceof InvalidProposerError ||
        error instanceof DuplicateActorRoleAssignmentError
      ) {
        throw error;
      }
      throw new ProjectPersistenceError('Error creating project', error as Error);
    }
  }

  private generateId(): string {
    return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
