import { SeedContext, SeedSection, log, normalizeEmail } from './common';
import { loadGuides, loadProjects, loadUsers } from './fixtures';
import { createStorage, deleteFromStorage } from './storage';

const PROJECT_SECTIONS: SeedSection[] = [
  'projects',
  'actors',
  'milestones',
  'observations',
  'status',
  'attachments',
];

export async function resetSeed(
  { prisma, options }: SeedContext,
  sections: SeedSection[],
): Promise<void> {
  const shouldResetProjects = sections.some((section) =>
    PROJECT_SECTIONS.includes(section),
  );
  const shouldResetUsers = sections.includes('users');
  const shouldResetGuides = sections.includes('guides');

  const projectNames = shouldResetProjects
    ? loadProjects().projects.map((project) => project.name)
    : [];
  const emails = shouldResetUsers
    ? loadUsers().users.map((user) => normalizeEmail(user.email))
    : [];
  const guideTitles = shouldResetGuides
    ? loadGuides().documents.map((document) => document.title)
    : [];

  const seededProjects = projectNames.length
    ? await prisma.project.findMany({
        where: { name: { in: projectNames } },
        select: {
          id: true,
          attachments: { select: { storageKey: true } },
        },
      })
    : [];
  const seededGuides = guideTitles.length
    ? await prisma.guideDocument.findMany({
        where: { title: { in: guideTitles } },
        select: { id: true, storageKey: true },
      })
    : [];

  if (options.dryRun) {
    log.info(
      `[dry-run] would remove ${seededProjects.length} project(s), ${seededGuides.length} guide document(s) and up to ${emails.length} user(s)`,
    );
    return;
  }

  const storageKeys = [
    ...seededProjects.flatMap((project) =>
      project.attachments.map((attachment) => attachment.storageKey),
    ),
    ...seededGuides.flatMap((document) =>
      document.storageKey ? [document.storageKey] : [],
    ),
  ];

  if (storageKeys.length > 0) {
    const storage = createStorage();
    if (storage) {
      await Promise.all(
        storageKeys.map(async (storageKey) => {
          try {
            await deleteFromStorage(storage, storageKey);
          } catch {
            log.warn(`Could not delete S3 object ${storageKey}`);
          }
        }),
      );
    } else {
      log.warn(
        'S3/RustFS is not configured; attachment and guide files will not be removed from storage.',
      );
    }
  }

  const deletedGuides = guideTitles.length
    ? await prisma.guideDocument.deleteMany({
        where: { title: { in: guideTitles } },
      })
    : { count: 0 };
  const deletedProjects = projectNames.length
    ? await prisma.project.deleteMany({
        where: { name: { in: projectNames } },
      })
    : { count: 0 };
  const deletedUsers = emails.length
    ? await prisma.user.deleteMany({ where: { email: { in: emails } } })
    : { count: 0 };

  log.ok(
    `Removed ${deletedProjects.count} seeded project(s), ${deletedGuides.count} guide document(s) and ${deletedUsers.count} seeded user(s)`,
  );
}
