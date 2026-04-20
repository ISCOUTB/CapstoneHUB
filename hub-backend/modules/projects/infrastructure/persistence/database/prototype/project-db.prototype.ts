export type DbProjectType = 'engineering' | 'consulting';

export type DbProjectStatus =
  | 'proposed'
  | 'under_review'
  | 'approved'
  | 'assigned'
  | 'in_progress'
  | 'closed'
  | 'rejected';

export type DbActorRole =
  | 'director'
  | 'coordinator'
  | 'student'
  | 'evaluator'
  | 'administrator';

export interface ProjectRow {
  id: string;
  projectCode: string;
  name: string;
  description: string;
  context: string;
  type: DbProjectType;
  status: DbProjectStatus;
  startDate: Date;
  endDate?: Date;
  estimatedCost?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSchoolRow {
  projectId: string;
  schoolName: string;
}

export interface ProjectNaturalProposerRow {
  projectId: string;
  fullName: string;
  idNumber: string;
  age: number;
  email: string;
}

export interface ProjectLegalProposerRow {
  projectId: string;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  contactUrl?: string;
}

export interface ActorRow {
  id: string;
  fullName: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectActorAssignmentRow {
  id: string;
  projectId: string;
  actorId: string;
  role: DbActorRole;
  assignedAt: Date;
}

export interface ProjectObservationRow {
  id: string;
  projectId: string;
  content: string;
  createdAt: Date;
}

export interface ProjectStatusHistoryRow {
  id: string;
  projectId: string;
  previousStatus?: DbProjectStatus;
  nextStatus: DbProjectStatus;
  description?: string;
  authorActorId?: string;
  changedAt: Date;
}

export class DbProjectAggregate {
  constructor(
    public readonly project: ProjectRow,
    public readonly schools: ProjectSchoolRow[],
    public readonly actors: ProjectActorAssignmentRow[],
    public readonly observations: ProjectObservationRow[],
    public readonly statusHistory: ProjectStatusHistoryRow[],
    public readonly naturalProposer?: ProjectNaturalProposerRow,
    public readonly legalProposer?: ProjectLegalProposerRow,
  ) {
    this.ensureSingleProposer();
    this.ensureUniqueActorByProject();
  }

  private ensureSingleProposer(): void {
    const proposerCount = Number(Boolean(this.naturalProposer)) + Number(Boolean(this.legalProposer));

    if (proposerCount !== 1) {
      throw new Error('A project aggregate must contain exactly one proposer row');
    }
  }

  private ensureUniqueActorByProject(): void {
    const actorIds = new Set<string>();

    for (const assignment of this.actors) {
      if (assignment.projectId !== this.project.id) {
        throw new Error('Actor assignment projectId does not match aggregate project id');
      }

      if (actorIds.has(assignment.actorId)) {
        throw new Error(`Duplicate actor assignment for actorId ${assignment.actorId}`);
      }

      actorIds.add(assignment.actorId);
    }
  }
}

export interface ProjectRelationalRepository {
  save(aggregate: DbProjectAggregate): Promise<void>;
  findById(projectId: string): Promise<DbProjectAggregate | null>;
  findAll(): Promise<DbProjectAggregate[]>;
  findByStatus(status: DbProjectStatus): Promise<DbProjectAggregate[]>;
  findByActorId(actorId: string): Promise<DbProjectAggregate[]>;
  findByProjectCode(projectCode: string): Promise<DbProjectAggregate | null>;
}
