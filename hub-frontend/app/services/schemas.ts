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
