type ProjectProposer = {
  type: "natural_person";
  fullName: string;
  idNumber: string;
  age: number;
  email: string;
};

type ProjectActor = {
  actorId: string;
  fullName: string;
  email?: string;
  role: string;
};

export type ProjectItem = {
  id: string;
  name: string;
  status: string;
  proposer: ProjectProposer;
  actors: ProjectActor[];
};

export type ProjectDetails = {
  id: number;
  name: string;
  description: string;
  context: string;
  status: string;
  startDate: string;
  endDate: string | null;
  estimatedCost: string | null;
  createdAt: string;
  updatedAt: string;
};
