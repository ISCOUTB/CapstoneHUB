import {
  ActorRole,
  GuideCategory,
  ProjectPhase,
  ProjectSource,
  ProjectStatus,
  ReportContentKind,
  UserRole,
} from '../../src/generated/prisma/client';
import { loadFixture } from './common';

export interface UserFixture {
  fullName: string;
  email: string;
  password?: string;
  roles: UserRole[];
}

export interface UsersFixture {
  defaultPassword: string;
  users: UserFixture[];
}

export interface NaturalProposerFixture {
  type: 'natural';
  fullName: string;
  idNumber?: string;
  email: string;
}

export type ProposerFixture = NaturalProposerFixture;

export interface ProjectActorFixture {
  email: string;
  role: ActorRole;
}

export interface ProjectFixture {
  name: string;
  description: string;
  context: string;
  location?: string | null;
  estimatedCost?: number | null;
  requiresLegalization?: boolean;
  isPrivate?: boolean;
  source?: ProjectSource;
  sourceDetails?: string | null;
  phase?: ProjectPhase;
  facultyAdvisor?: string | null;
  teamRequirements?: string | null;
  expectedOutcomes?: string | null;
  deliverables?: string[];
  startDate: string;
  endDate?: string | null;
  submissionConsentAt?: string | null;
  schools?: string[];
  /**
   * Email del `User` sembrado que registra el proyecto. Cuando está presente, el
   * proyecto se enlaza mediante `proposerUserId` para que el proponente pueda
   * verlo.
   */
  proposerUserEmail?: string;
  proposer: ProposerFixture;
  targetStatus: ProjectStatus;
  statusDescription?: string | null;
  actors?: ProjectActorFixture[];
  attachments?: string[];
}

export interface ProjectsFixture {
  projects: ProjectFixture[];
}

export interface MilestoneFixture {
  title: string;
  description?: string;
  dueDate: string;
  completed?: boolean;
  isMinimum?: boolean;
  phase?: ProjectPhase;
}

export type MilestonesFixture = Record<string, MilestoneFixture[]>;

export interface ObservationFixture {
  authorEmail: string;
  content: string;
}

export type ObservationsFixture = Record<string, ObservationFixture[]>;

export interface ReportFixture {
  title: string;
  description?: string;
  dueDate: string;
  type?: ReportContentKind;
  allowedMimeTypes?: string[];
  maxFiles?: number;
  status?: 'pending' | 'submitted' | 'accepted' | 'rejected';
  submittedAt?: string | null;
  reviewComment?: string | null;
  /** Títulos de los hitos del mismo proyecto a los que se vincula la entrega. */
  milestoneTitles?: string[];
}

export type ReportsFixture = Record<string, ReportFixture[]>;

export interface GuideDocumentFixture {
  title: string;
  description?: string;
  category: GuideCategory;
  audiences: UserRole[];
  externalUrl?: string;
  isPublished?: boolean;
}

export interface GuidesFixture {
  documents: GuideDocumentFixture[];
}

export const loadUsers = (): UsersFixture =>
  loadFixture<UsersFixture>('users.json');
export const loadProjects = (): ProjectsFixture =>
  loadFixture<ProjectsFixture>('projects.json');
export const loadMilestones = (): MilestonesFixture =>
  loadFixture<MilestonesFixture>('milestones.json');
export const loadObservations = (): ObservationsFixture =>
  loadFixture<ObservationsFixture>('observations.json');
export const loadReports = (): ReportsFixture =>
  loadFixture<ReportsFixture>('reports.json');
export const loadGuides = (): GuidesFixture =>
  loadFixture<GuidesFixture>('guides.json');
