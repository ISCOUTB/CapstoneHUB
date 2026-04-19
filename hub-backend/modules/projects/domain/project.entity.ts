import { ProjectType } from './project-type.enum';
import { ProjectStatus } from './project-status.enum';
import { DuplicateActorRoleAssignmentError, InvalidProposerError } from './exceptions/project.exceptions';
import { ProjectActor, ProjectProposer, ProposerType } from './project.types';

export interface ProjectProps {
  id: string;
  projectCode: string; // Código identificador único para búsqueda rápida
  name: string; // Nombre del proyecto
  description: string; // Descripción del proyecto
  context: string; // Contexto alrededor del proyecto
  type: ProjectType; // Tipo: engineering o consulting
  status: ProjectStatus; // Estado actual: proposed, under_review, approved, assigned, in_progress, closed, rejected
  schools: string[]; // Escuelas de la UTB involucradas
  proposer: ProjectProposer;
  actors: ProjectActor[];
  startDate: Date; // Fecha de inicio
  endDate?: Date; // Fecha de fin (si existe)
  estimatedCost?: number; // Costo estimado
  observations: string[]; // Observaciones/comentarios acumulados
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectProps {
  id: string;
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

// reglas de negocio para transiciones de estado
const allowedStatusTransitions: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.PROPOSED]: [ProjectStatus.UNDER_REVIEW, ProjectStatus.REJECTED],
  [ProjectStatus.UNDER_REVIEW]: [ProjectStatus.APPROVED, ProjectStatus.REJECTED],
  [ProjectStatus.APPROVED]: [ProjectStatus.ASSIGNED, ProjectStatus.REJECTED],
  [ProjectStatus.ASSIGNED]: [ProjectStatus.IN_PROGRESS, ProjectStatus.REJECTED],
  [ProjectStatus.IN_PROGRESS]: [ProjectStatus.CLOSED, ProjectStatus.REJECTED],
  [ProjectStatus.CLOSED]: [],
  [ProjectStatus.REJECTED]: [],
};

export class Project {
  private constructor(private readonly props: ProjectProps) {}

  static create(props: CreateProjectProps): Project {
    this.ensureValidProposer(props.proposer);
    this.ensureUniqueActorRoleByPerson(props.actors || []);

    const now = new Date();

    return new Project({
      ...props,
      status: ProjectStatus.PROPOSED,
      observations: [],
      actors: props.actors || [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: ProjectProps): Project {
    this.ensureValidProposer(props.proposer);
    this.ensureUniqueActorRoleByPerson(props.actors);
    return new Project(props);
  }

  private static ensureValidProposer(proposer: ProjectProposer): void {
    if (proposer.type === ProposerType.NATURAL_PERSON) {
      if (!proposer.fullName || !proposer.idNumber || !proposer.email) {
        throw new InvalidProposerError('Natural person proposer requires fullName, idNumber and email');
      }
      if (proposer.age <= 0) {
        throw new InvalidProposerError('Natural person proposer age must be greater than 0');
      }
      return;
    }

    if (!proposer.legalName || !proposer.taxId || !proposer.email || !proposer.phone) {
      throw new InvalidProposerError(
        'Legal entity proposer requires legalName, taxId, email and phone',
      );
    }
  }

  private static ensureUniqueActorRoleByPerson(actors: ProjectActor[]): void {
    const assigned = new Set<string>();
    for (const actor of actors) {
      if (assigned.has(actor.actorId)) {
        throw new DuplicateActorRoleAssignmentError(actor.actorId);
      }
      assigned.add(actor.actorId);
    }
  }

  get id(): string {
    return this.props.id;
  }

  get projectCode(): string {
    return this.props.projectCode;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get context(): string {
    return this.props.context;
  }

  get type(): ProjectType {
    return this.props.type;
  }

  get status(): ProjectStatus {
    return this.props.status;
  }

  get schools(): string[] {
    return [...this.props.schools];
  }

  get proposer(): ProjectProposer {
    return { ...this.props.proposer };
  }

  get actors(): ProjectActor[] {
    return this.props.actors.map((actor) => ({ ...actor }));
  }

  get startDate(): Date {
    return new Date(this.props.startDate);
  }

  get endDate(): Date | undefined {
    return this.props.endDate ? new Date(this.props.endDate) : undefined;
  }

  get estimatedCost(): number | undefined {
    return this.props.estimatedCost;
  }

  get observations(): string[] {
    return [...this.props.observations];
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  changeStatus(nextStatus: ProjectStatus): void {
    if (this.props.status === nextStatus) {
      return;
    }

    const allowedTransitions = allowedStatusTransitions[this.props.status];
    if (!allowedTransitions.includes(nextStatus)) {
      throw new Error(
        `Invalid project status transition from ${this.props.status} to ${nextStatus}`
      );
    }

    this.props.status = nextStatus;
    this.props.updatedAt = new Date();
  }

  assignActor(actor: ProjectActor): void {
    const exists = this.props.actors.some((item) => item.actorId === actor.actorId);
    if (exists) {
      throw new DuplicateActorRoleAssignmentError(actor.actorId);
    }

    this.props.actors.push({ ...actor });
    this.props.updatedAt = new Date();
  }

  removeActor(actorId: string): void {
    const index = this.props.actors.findIndex((item) => item.actorId === actorId);
    if (index > -1) {
      this.props.actors.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  addObservation(observation: string): void {
    this.props.observations.push(observation);
    this.props.updatedAt = new Date();
  }

  updateDetails(input: {
    name?: string;
    description?: string;
    context?: string;
    actors?: ProjectActor[];
    endDate?: Date;
  }): void {
    if (input.name !== undefined) {
      this.props.name = input.name;
    }

    if (input.description !== undefined) {
      this.props.description = input.description;
    }

    if (input.context !== undefined) {
      this.props.context = input.context;
    }

    if (input.actors !== undefined) {
      Project.ensureUniqueActorRoleByPerson(input.actors);
      this.props.actors = input.actors.map((actor) => ({ ...actor }));
    }

    if (input.endDate !== undefined) {
      this.props.endDate = input.endDate;
    }

    this.props.updatedAt = new Date();
  }

  toPrimitives(): ProjectProps {
    return {
      ...this.props,
      schools: [...this.props.schools],
      proposer: { ...this.props.proposer },
      actors: this.props.actors.map((actor) => ({ ...actor })),
      observations: [...this.props.observations],
      startDate: new Date(this.props.startDate),
      endDate: this.props.endDate ? new Date(this.props.endDate) : undefined,
      createdAt: new Date(this.props.createdAt),
      updatedAt: new Date(this.props.updatedAt),
    };
  }
}
