import { SeedContext, log } from './common';
import { loadGuides } from './fixtures';

/**
 * Siembra el catálogo de documentos de apoyo con entradas de ejemplo. Los
 * archivos quedan sin adjuntar a propósito: se suben desde /admin/guides y
 * hasta entonces la página los muestra como «Próximamente».
 */
export async function seedGuides({
  prisma,
  options,
}: SeedContext): Promise<void> {
  const { documents } = loadGuides();

  for (const fixture of documents) {
    const existing = await prisma.guideDocument.findFirst({
      where: { title: fixture.title },
      select: { id: true },
    });

    if (options.dryRun) {
      const action = existing ? 'update' : 'create';
      log.info(
        `[dry-run] would ${action} guide document "${fixture.title}"`,
      );
      continue;
    }

    const data = {
      description: fixture.description ?? null,
      category: fixture.category,
      audiences: fixture.audiences,
      externalUrl: fixture.externalUrl ?? null,
      isPublished: fixture.isPublished ?? true,
    };

    if (existing) {
      await prisma.guideDocument.update({
        where: { id: existing.id },
        data,
      });
      log.info(`Updated guide document "${fixture.title}"`);
      continue;
    }

    await prisma.guideDocument.create({
      data: { title: fixture.title, ...data },
    });
    log.ok(`Created guide document "${fixture.title}"`);
  }
}
