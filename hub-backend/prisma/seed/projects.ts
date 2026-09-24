import { SeedContext, log } from './common';
import { ProjectFixture, loadProjects } from './fixtures';
import { ProjectSource } from '../../src/generated/prisma/client';

/** Resuelve el `User` que propuso el proyecto, si el fixture lo indica. */
async function resolveProposerUserId(
  prisma: SeedContext['prisma'],
  project: ProjectFixture,
): Promise<number | null> {
  if (!project.proposerUserEmail) {
    return null;
  }

  const email = project.proposerUserEmail.trim().toLowerCase();
  const proposerUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!proposerUser) {
    throw new Error(
      `Proposer user "${project.proposerUserEmail}" was not found. Run the users section first or check the fixtures.`,
    );
  }

  return proposerUser.id;
}

/** Payload de creación derivado del fixture, con sus valores por defecto. */
function buildCreateData(
  project: ProjectFixture,
  proposerUserId: number | null,
): Parameters<SeedContext['prisma']['project']['create']>[0]['data'] {
  return {
    name: project.name,
    description: project.description,
    context: project.context,
    location: project.location ?? null,
    estimatedCost: project.estimatedCost ?? null,
    requiresLegalization: project.requiresLegalization ?? false,
    isPrivate: project.isPrivate ?? true,
    source: project.source ?? ProjectSource.external_entity,
    facultyAdvisor: project.facultyAdvisor ?? null,
    teamRequirements: project.teamRequirements ?? null,
    expectedOutcomes: project.expectedOutcomes ?? null,
    startDate: new Date(project.startDate),
    endDate: project.endDate ? new Date(project.endDate) : null,
    proposerUserId,
    schools: project.schools?.length
      ? { create: project.schools.map((schoolName) => ({ schoolName })) }
      : undefined,
    deliverables: project.deliverables?.length
      ? {
          create: project.deliverables.map((description) => ({ description })),
        }
      : undefined,
    naturalProposer: {
      create: {
        fullName: project.proposer.fullName,
        idNumber: project.proposer.idNumber ?? null,
        email: project.proposer.email,
      },
    },
  };
}

/** Actualiza un proyecto ya sembrado para alinearlo con el fixture. */
async function updateExistingProject(
  context: SeedContext,
  project: ProjectFixture,
  projectId: number,
  proposerUserId: number | null,
): Promise<void> {
  const { prisma, options } = context;

  log.info(`Project already exists: ${project.name} (#${projectId})`);

  if (options.dryRun) {
    return;
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      isPrivate: project.isPrivate ?? true,
      proposerUserId,
    },
  });
}

async function createProject(
  context: SeedContext,
  project: ProjectFixture,
  proposerUserId: number | null,
): Promise<void> {
  const { prisma, options } = context;

  if (options.dryRun) {
    log.info(`[dry-run] would create project ${project.name}`);
    return;
  }

  const created = await prisma.project.create({
    data: buildCreateData(project, proposerUserId),
    select: { id: true },
  });

  log.ok(`Created project ${project.name} (#${created.id})`);
}

export async function seedProjects(context: SeedContext): Promise<void> {
  const { prisma } = context;
  const { projects } = loadProjects();

  for (const project of projects) {
    const proposerUserId = await resolveProposerUserId(prisma, project);
    const existing = await prisma.project.findFirst({
      where: { name: project.name },
      select: { id: true },
    });

    if (existing) {
      await updateExistingProject(
        context,
        project,
        existing.id,
        proposerUserId,
      );
      continue;
    }

    await createProject(context, project, proposerUserId);
  }
}
