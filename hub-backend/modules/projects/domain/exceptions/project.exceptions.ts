/**
 * Excepciones de dominio para el módulo de proyectos
 */

export class ProjectNotFoundError extends Error {
  constructor(id: string) {
    super(`Project with id ${id} not found`);
    this.name = 'ProjectNotFoundError';
  }
}

export class ProjectCodeAlreadyExistsError extends Error {
  constructor(code: string) {
    super(`Project with code ${code} already exists`);
    this.name = 'ProjectCodeAlreadyExistsError';
  }
}

export class InvalidProjectStatusTransitionError extends Error {
  constructor(currentStatus: string, requestedStatus: string) {
    super(`Cannot transition from ${currentStatus} to ${requestedStatus}`);
    this.name = 'InvalidProjectStatusTransitionError';
  }
}

export class ProjectPersistenceError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ProjectPersistenceError';
  }
}

export class InvalidProposerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProposerError';
  }
}

export class DuplicateActorRoleAssignmentError extends Error {
  constructor(actorId: string) {
    super(`Actor ${actorId} already has a role in this project`);
    this.name = 'DuplicateActorRoleAssignmentError';
  }
}
