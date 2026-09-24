import { SeedContext, log } from './common';
import { loadProjects } from './fixtures';
import { ProjectSource } from '../../src/generated/prisma/client';

export async function seedProjects({
  prisma,
  options,
}: SeedContext): Promise<void> {
  const { projects } = loadProjects();

  for (const project of projects) {
    let proposerUserId: number | null = null;

    if (project.proposerUserEmail) {
      const proposerUser = await prisma.user.findUnique({
        where: { email: project.proposerUserEmail.trim().toLowerCase() },
        select: { id: true },
      });

      if (!proposerUser) {
        throw new Error(
          `Proposer user "${project.proposerUserEmail}" was not found. Run the users section first or check the fixtures.`,
        );
      }

      proposerUserId = proposerUser.id;
    }

    const existing = await prisma.project.findFirst({
      where: { name: project.name },
      select: { id: true },
    });

    if (existing) {
      log.info(`Project already exists: ${project.name} (#${existing.id})`);

      if (options.dryRun) {
        continue;
      }

      await prisma.project.update({
        where: { id: existing.id },
        data: {
          isPrivate: project.isPrivate ?? true,
          proposerUserId,
        },
      });
      continue;
    }

    if (options.dryRun) {
      log.info(`[dry-run] would create project ${project.name}`);
      continue;
    }

    const created = await prisma.project.create({
      data: {
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
              create: project.deliverables.map((description) => ({
                description,
              })),
            }
          : undefined,
        naturalProposer: {
          create: {
            fullName: project.proposer.fullName,
            idNumber: project.proposer.idNumber ?? null,
            email: project.proposer.email,
          },
        },
      },
      select: { id: true },
    });

    log.ok(`Created project ${project.name} (#${created.id})`);
  }
}
