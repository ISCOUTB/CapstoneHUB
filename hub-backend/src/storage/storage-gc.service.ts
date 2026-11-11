import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StorageService } from './storage.service';

const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const PROJECT_PREFIX = 'projects/';
const GUIDE_PREFIX = 'guides/';

export type StorageGcOptions = {
  /** Solo considera huérfanos con antigüedad mayor a este valor. */
  maxAgeMs?: number;
  /** Lista lo que borraría sin tocar el almacenamiento. */
  dryRun?: boolean;
};

export type StorageGcResult = {
  scanned: number;
  deleted: string[];
  kept: number;
};

/**
 * Elimina objetos subidos directamente que nunca llegaron a confirmarse (el
 * usuario cerró el navegador tras subir y antes de crear el contenido).
 */
@Injectable()
export class StorageGcService {
  private readonly logger = new Logger(StorageGcService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async run(options: StorageGcOptions = {}): Promise<StorageGcResult> {
    const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
    const cutoff = Date.now() - maxAgeMs;

    const [projectObjects, guideObjects, projectAttachments, guideDocuments] =
      await Promise.all([
        this.storage.listObjects(PROJECT_PREFIX),
        this.storage.listObjects(GUIDE_PREFIX),
        this.prisma.projectAttachment.findMany({
          select: { storageKey: true },
        }),
        this.prisma.guideDocument.findMany({
          where: { storageKey: { not: null } },
          select: { storageKey: true },
        }),
      ]);

    const objects = [...projectObjects, ...guideObjects];
    const known = new Set<string>([
      ...projectAttachments.map((item) => item.storageKey),
      ...guideDocuments.flatMap((item) =>
        item.storageKey ? [item.storageKey] : [],
      ),
    ]);

    const deleted: string[] = [];

    for (const object of objects) {
      if (known.has(object.key)) {
        continue;
      }

      const isOldEnough =
        object.lastModified === null || object.lastModified.getTime() < cutoff;

      if (!isOldEnough) {
        continue;
      }

      if (options.dryRun) {
        deleted.push(object.key);
        continue;
      }

      try {
        await this.storage.delete(object.key);
        deleted.push(object.key);
      } catch (error) {
        this.logger.warn(
          `Could not delete orphan object ${object.key}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    this.logger.log(
      `${options.dryRun ? '[dry-run] ' : ''}storage gc: ${
        deleted.length
      } orphan(s) of ${objects.length} object(s)`,
    );

    return {
      scanned: objects.length,
      deleted,
      kept: objects.length - deleted.length,
    };
  }
}
