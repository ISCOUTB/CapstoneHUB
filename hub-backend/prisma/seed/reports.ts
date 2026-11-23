import { SeedContext, log, requireProjectId } from './common';
import { ReportFixture, loadReports } from './fixtures';

/** MIME por defecto para los fixtures de tipo Archivo que no los especifican. */
const DEFAULT_FILE_MIME_TYPES: string[] = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/ogg',
];

/** Crea o actualiza una entrega. */
async function seedReport(
  prisma: SeedContext['prisma'],
  projectId: number,
  projectName: string,
  report: ReportFixture,
  options: SeedContext['options'],
): Promise<void> {
  const existing = await prisma.projectReport.findFirst({
    where: { projectId, title: report.title },
    select: { id: true },
  });

  if (options.dryRun) {
    const action = existing ? 'update' : 'create';
    log.info(
      `[dry-run] would ${action} report "${report.title}" (${projectName})`,
    );
    return;
  }

  const status = report.status ?? 'pending';
  const submittedAt =
    status === 'pending' ? null : new Date(report.submittedAt ?? Date.now());
  const reviewedAt =
    status === 'accepted' || status === 'rejected'
      ? new Date(report.submittedAt ?? Date.now())
      : null;
  const reviewComment = report.reviewComment ?? null;

  const type = report.type ?? 'file';
  const isFileType = type === 'file';

  const data = {
    description: report.description ?? null,
    dueDate: new Date(report.dueDate),
    type,
    allowedMimeTypes: isFileType
      ? (report.allowedMimeTypes ?? DEFAULT_FILE_MIME_TYPES)
      : [],
    maxFiles: isFileType ? (report.maxFiles ?? 1) : null,
    status,
    submittedAt,
    reviewedAt,
    reviewComment,
  };

  if (existing) {
    await prisma.projectReport.update({
      where: { id: existing.id },
      data,
    });
    log.info(`Updated report "${report.title}" (${projectName})`);
    return;
  }

  await prisma.projectReport.create({
    data: { projectId, title: report.title, ...data },
    select: { id: true },
  });
  log.ok(`Created report "${report.title}" (${projectName})`);
}

export async function seedReports({
  prisma,
  options,
}: SeedContext): Promise<void> {
  const reportsByProject = loadReports();

  await Promise.all(
    Object.entries(reportsByProject).map(async ([projectName, reports]) => {
      const projectId = await requireProjectId(prisma, projectName);

      await Promise.all(
        reports.map((report) =>
          seedReport(prisma, projectId, projectName, report, options),
        ),
      );
    }),
  );
}
