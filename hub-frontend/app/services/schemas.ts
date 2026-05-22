type ProjectNaturalProposer = {
  type: "natural_person";
  fullName: string;
  idNumber: string;
  email: string;
};

type ProjectLegalProposer = {
  type: "legal_person";
  legalName: string;
  nit: string;
  email: string;
  phone: string;
  contactUrl: string | null;
};

export type ProjectProposer = ProjectNaturalProposer | ProjectLegalProposer;

type ProjectActor = {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  assignedAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
  };
};

export type UserSummary = {
  id: number;
  fullName: string;
  email: string;
};

export type ProjectObservationItem = {
  id: number;
  projectId: number;
  content: string;
  createdAt: string;
};

export type ProjectItem = {
  id: string;
  name: string;
  location?: string;
  context?: string;
  status: string;
  proposer?: ProjectProposer;
  actors: ProjectActor[];
};

export type ProjectDetails = {
  id: number;
  name: string;
  description: string;
  context: string;
  status: string;
  proposer?: ProjectProposer;
  startDate: string;
  endDate: string | null;
  estimatedCost: string | null;
  createdAt: string;
  updatedAt: string;
  observations: ProjectObservationItem[];
  actorAssignments: ProjectActor[];
};
