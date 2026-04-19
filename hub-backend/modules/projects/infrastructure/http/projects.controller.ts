import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  CreateProjectDto,
  CreateProjectUseCase,
  GetProjectByIdUseCase,
  ListProjectsUseCase,
  ProjectResponseDto,
  UpdateProjectStatusUseCase,
} from '../../application/use-cases';
import { ProjectStatus } from '../../domain/project-status.enum';
import { ProjectType } from '../../domain/project-type.enum';
import {
  DuplicateActorRoleAssignmentError,
  InvalidProjectStatusTransitionError,
  InvalidProposerError,
  ProjectCodeAlreadyExistsError,
  ProjectNotFoundError,
} from '../../domain/exceptions/project.exceptions';
import {
  PROJECT_REPOSITORY,
} from '../../domain/ports/project.repository.port';
import type { IProjectRepository } from '../../domain/ports/project.repository.port';
import { ProjectActor, ProjectActorRole, ProjectProposer, ProposerType } from '../../domain/project.types';

interface NaturalPersonProposerRequest {
  type: ProposerType.NATURAL_PERSON;
  fullName: string;
  idNumber: string;
  age: number;
  email: string;
}

interface LegalEntityProposerRequest {
  type: ProposerType.LEGAL_ENTITY;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  contactUrl?: string;
}

type ProposerRequest = NaturalPersonProposerRequest | LegalEntityProposerRequest;

interface ProjectActorRequest {
  actorId: string;
  fullName: string;
  email?: string;
  role: ProjectActorRole;
}

interface CreateProjectRequest {
  projectCode: string;
  name: string;
  description: string;
  context: string;
  type: 'engineering' | 'consulting';
  schools: string[];
  proposer: ProposerRequest;
  actors?: ProjectActorRequest[];
  startDate: string;
  estimatedCost?: number;
}

interface UpdateProjectStatusRequest {
  status: ProjectStatus;
}

@Controller('projects')
export class ProjectsController {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
  ) {}

  @Post()
  async create(@Body() body: CreateProjectRequest): Promise<ProjectResponseDto> {
    try {
      this.validateCreateRequest(body);

      const useCase = new CreateProjectUseCase(this.projectRepository);
      const input: CreateProjectDto = {
        projectCode: body.projectCode,
        name: body.name,
        description: body.description,
        context: body.context,
        type:
          body.type === 'engineering'
            ? ProjectType.ENGINEERING
            : ProjectType.CONSULTING,
        schools: body.schools,
        proposer: this.mapProposer(body.proposer),
        actors: this.mapActors(body.actors || []),
        startDate: new Date(body.startDate),
        estimatedCost: body.estimatedCost,
      };

      return await useCase.execute(input);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get()
  async list(): Promise<ProjectResponseDto[]> {
    try {
      const useCase = new ListProjectsUseCase(this.projectRepository);
      return await useCase.execute();
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ProjectResponseDto> {
    try {
      const useCase = new GetProjectByIdUseCase(this.projectRepository);
      return await useCase.execute(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateProjectStatusRequest,
  ): Promise<ProjectResponseDto> {
    try {
      if (!body.status || !Object.values(ProjectStatus).includes(body.status)) {
        throw new BadRequestException('Invalid status value');
      }

      const useCase = new UpdateProjectStatusUseCase(this.projectRepository);
      return await useCase.execute({
        projectId: id,
        newStatus: body.status,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  private validateCreateRequest(body: CreateProjectRequest): void {
    if (!body.projectCode || !body.name || !body.description || !body.context) {
      throw new BadRequestException(
        'projectCode, name, description and context are required',
      );
    }

    if (!body.type || !['engineering', 'consulting'].includes(body.type)) {
      throw new BadRequestException('type must be engineering or consulting');
    }

    if (!body.schools || !Array.isArray(body.schools) || body.schools.length === 0) {
      throw new BadRequestException('schools is required and must be a non-empty array');
    }

    if (!body.proposer) {
      throw new BadRequestException('proposer is required');
    }

    if (!body.actors || !Array.isArray(body.actors)) {
      throw new BadRequestException('actors must be an array');
    }

    const seen = new Set<string>();
    for (const actor of body.actors) {
      if (!actor.actorId || !actor.fullName || !actor.role) {
        throw new BadRequestException('each actor requires actorId, fullName and role');
      }
      if (seen.has(actor.actorId)) {
        throw new BadRequestException(`actor ${actor.actorId} appears more than once`);
      }
      seen.add(actor.actorId);
    }

    const parsedDate = new Date(body.startDate);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('startDate must be a valid ISO date string');
    }
  }

  private mapProposer(proposer: ProposerRequest): ProjectProposer {
    if (proposer.type === ProposerType.NATURAL_PERSON) {
      return {
        type: ProposerType.NATURAL_PERSON,
        fullName: proposer.fullName,
        idNumber: proposer.idNumber,
        age: proposer.age,
        email: proposer.email,
      };
    }

    return {
      type: ProposerType.LEGAL_ENTITY,
      legalName: proposer.legalName,
      taxId: proposer.taxId,
      email: proposer.email,
      phone: proposer.phone,
      contactUrl: proposer.contactUrl,
    };
  }

  private mapActors(actors: ProjectActorRequest[]): ProjectActor[] {
    return actors.map((actor) => ({
      actorId: actor.actorId,
      fullName: actor.fullName,
      email: actor.email,
      role: actor.role,
    }));
  }

  private handleError(error: unknown): never {
    if (error instanceof BadRequestException) {
      throw error;
    }

    if (error instanceof ProjectCodeAlreadyExistsError) {
      throw new ConflictException(error.message);
    }

    if (error instanceof ProjectNotFoundError) {
      throw new NotFoundException(error.message);
    }

    if (error instanceof InvalidProjectStatusTransitionError) {
      throw new BadRequestException(error.message);
    }

    if (error instanceof InvalidProposerError) {
      throw new BadRequestException(error.message);
    }

    if (error instanceof DuplicateActorRoleAssignmentError) {
      throw new BadRequestException(error.message);
    }

    throw new InternalServerErrorException('Unexpected error while processing project request');
  }
}
