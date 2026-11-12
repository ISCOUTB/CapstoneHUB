import {
  SeedContext,
  SeedSection,
  createPrismaClient,
  log,
  parseArgs,
  printHelp,
  resolveSections,
} from './seed/common';
import { seedUsers } from './seed/users';
import { seedProjects } from './seed/projects';
import { seedActors } from './seed/actors';
import { seedMilestones } from './seed/milestones';
import { seedObservations } from './seed/observations';
import { seedProjectStatus } from './seed/status';
import { seedAttachments } from './seed/attachments';
import { seedReports } from './seed/reports';
import { seedGuides } from './seed/guides';
import { resetSeed } from './seed/reset';

const SECTION_RUNNERS: Record<
  SeedSection,
  (context: SeedContext) => Promise<void>
> = {
  users: seedUsers,
  projects: seedProjects,
  actors: seedActors,
  milestones: seedMilestones,
  observations: seedObservations,
  status: seedProjectStatus,
  attachments: seedAttachments,
  reports: seedReports,
  guides: seedGuides,
};

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (
    process.env.NODE_ENV === 'production' &&
    !options.force &&
    !options.dryRun
  ) {
    throw new Error(
      'Refusing to seed with NODE_ENV=production. Re-run with --force to override, or --dry-run to preview.',
    );
  }

  const prisma = createPrismaClient();
  const context: SeedContext = { prisma, options };

  try {
    const sections = resolveSections(options.only);
    log.step(
      `CapstoneHUB mock data seeder -> ${sections.join(', ')}${
        options.dryRun ? ' (dry-run)' : ''
      }`,
    );

    if (options.reset) {
      log.step('Reset');
      await resetSeed(context, sections);
    }

    for (const section of sections) {
      log.step(`Section: ${section}`);
      await SECTION_RUNNERS[section](context);
    }

    log.ok('Seeding completed');
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  log.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
