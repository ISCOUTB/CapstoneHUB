export enum ProposerType {
  NATURAL_PERSON = 'natural_person',
  LEGAL_ENTITY = 'legal_entity',
}

export interface NaturalPersonProposer {
  type: ProposerType.NATURAL_PERSON;
  fullName: string;
  idNumber: string;
  age: number;
  email: string;
}

export interface LegalEntityProposer {
  type: ProposerType.LEGAL_ENTITY;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  contactUrl?: string;
}

export type ProjectProposer = NaturalPersonProposer | LegalEntityProposer;

export enum ProjectActorRole {
  DIRECTOR = 'director',
  COORDINATOR = 'coordinator',
  STUDENT = 'student',
  EVALUATOR = 'evaluator',
  ADMINISTRATOR = 'administrator',
}

export interface ProjectActor {
  actorId: string;
  fullName: string;
  email?: string;
  role: ProjectActorRole;
}

export interface ProjectHistoryEntry {
  date: Date;
  status: string;
  description: string;
  authorActorId: string;
}

export interface ProjectDetails {
  generalObjectives?: string;
  justification?: string;
  expectedResult?: string;
  beneficiaries?: string[];
  methodologies?: string[];
  legalFramework?: string;
}

export interface ProjectAttachment {
  id: string;
  url: string;
  name: string;
  uploadedAt: Date;
  uploadedByActorId?: string;
}
