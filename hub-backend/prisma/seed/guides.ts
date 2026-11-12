import { SeedContext, log } from './common';
import { loadGuides } from './fixtures';

type SeedGuideResult = {
  action: 'create' | 'update';
  title: string;
  dryRun: boolean;
};

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

  const results = await Promise.all(
    documents.map(async (fixture): Promise<SeedGuideResult> => {
      const existing = await prisma.guideDocument.findFirst({
        where: { title: fixture.title },
        select: { id: true },
      });

      if (options.dryRun) {
        return {
          action: existing ? 'update' : 'create',
          title: fixture.title,
          dryRun: true,
        };
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
        return {
          action: 'update',
          title: fixture.title,
          dryRun: false,
        };
      }

      await prisma.guideDocument.create({
        data: { title: fixture.title, ...data },
      });
      return {
        action: 'create',
        title: fixture.title,
        dryRun: false,
      };
    }),
  );

  for (const result of results) {
    if (result.dryRun) {
      log.info(
        `[dry-run] would ${result.action} guide document "${result.title}"`,
      );
    } else if (result.action === 'update') {
      log.info(`Updated guide document "${result.title}"`);
    } else {
      log.ok(`Created guide document "${result.title}"`);
    }
  }
}
