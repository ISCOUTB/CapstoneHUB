import { BadRequestException } from '@nestjs/common';
import { ReportContentKind } from '../generated/prisma/client';
import {
  MAX_REPORT_FILE_SIZE_BYTES,
  REPORT_FILE_MIME_TYPES,
} from '../attachments/attachments.constants';
import { UpdateReportDto } from './reports.dto';

/**
 * Reglas puras de las entregas (validación de configuración y normalización de
 * contenido), extraídas del servicio para mantenerlo enfocado en el flujo de
 * datos. No acceden a Prisma ni a almacenamiento.
 */

export function normalizeTitle(title: string): string {
  const trimmed = title.trim();

  if (!trimmed) {
    throw new BadRequestException('Report title is required');
  }

  return trimmed;
}

export function normalizeTextContent(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';

  if (!trimmed) {
    throw new BadRequestException('Text content is required');
  }

  return trimmed;
}

export function normalizeUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';

  if (!trimmed) {
    throw new BadRequestException('Link URL is required');
  }

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new BadRequestException('Link URL is not valid');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new BadRequestException('Link URL must use http or https');
  }

  return parsed.toString();
}

export function assertReportAcceptsFiles(type: ReportContentKind): void {
  if (type !== ReportContentKind.file) {
    throw new BadRequestException('This report does not accept files');
  }
}

export function assertKindMatchesReportType(
  kind: ReportContentKind,
  reportType: ReportContentKind,
): void {
  if (kind !== reportType) {
    throw new BadRequestException(
      `This report only accepts ${reportType} content`,
    );
  }
}

const GENERIC_FILE_MIME_TYPES: ReadonlySet<string> = new Set([
  '',
  'application/octet-stream',
]);

/**
 * Algunos navegadores envían los `.zip` como `application/octet-stream` o sin
 * MIME. Se normalizan a `application/zip` solo cuando la extensión es `.zip`;
 * después se valida contra los MIME permitidos de la entrega.
 */
export function resolveReportFileMimeType(
  mimeType: string,
  originalName: string,
): string {
  const normalizedName = originalName.trim().toLowerCase();

  if (
    normalizedName.endsWith('.zip') &&
    GENERIC_FILE_MIME_TYPES.has(mimeType.trim().toLowerCase())
  ) {
    return 'application/zip';
  }

  return mimeType;
}

export function assertMimeAllowed(
  mimeType: string,
  allowedMimeTypes: string[],
): void {
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new BadRequestException(
      `MIME type not allowed for this report: ${mimeType}`,
    );
  }
}

export function assertFileMatchesKind(metadata: {
  mimeType: string;
  sizeBytes: number;
}): void {
  if (!REPORT_FILE_MIME_TYPES.has(metadata.mimeType)) {
    throw new BadRequestException(
      `Unsupported file type: ${metadata.mimeType}`,
    );
  }

  assertStoredSizeWithinLimit(metadata.sizeBytes);
}

export function assertStoredSizeWithinLimit(sizeBytes: number): void {
  if (sizeBytes > MAX_REPORT_FILE_SIZE_BYTES) {
    throw new BadRequestException(
      `File exceeds the ${megabytes(MAX_REPORT_FILE_SIZE_BYTES)} MB limit`,
    );
  }
}

export function megabytes(bytes: number): number {
  return Math.round(bytes / (1024 * 1024));
}

export function isFileReportType(type: ReportContentKind): boolean {
  return type === ReportContentKind.file;
}

export function assertValidReportType(type: ReportContentKind): void {
  if (
    type !== ReportContentKind.text &&
    type !== ReportContentKind.link &&
    type !== ReportContentKind.file
  ) {
    throw new BadRequestException(`Unsupported report type: ${type}`);
  }
}

function allowedMimeTypesForReportType(
  type: ReportContentKind,
): ReadonlySet<string> {
  return type === ReportContentKind.file
    ? REPORT_FILE_MIME_TYPES
    : new Set<string>();
}

export function sameStringSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const sortedLeft = [...left].sort((a, b) => a.localeCompare(b));
  const sortedRight = [...right].sort((a, b) => a.localeCompare(b));

  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

export function validateReportConfig(
  type: ReportContentKind,
  allowedMimeTypes: string[] | undefined,
  maxFiles: number | null | undefined,
): { allowedMimeTypes: string[]; maxFiles: number | null } {
  assertValidReportType(type);

  if (!isFileReportType(type)) {
    if ((allowedMimeTypes?.length ?? 0) > 0) {
      throw new BadRequestException(
        'Text and link reports do not accept allowed MIME types',
      );
    }

    if (maxFiles !== undefined && maxFiles !== null) {
      throw new BadRequestException(
        'Text and link reports do not accept a maximum number of files',
      );
    }

    return { allowedMimeTypes: [], maxFiles: null };
  }

  const allowed = allowedMimeTypesForReportType(type);
  const unique = [...new Set(allowedMimeTypes ?? [])];

  if (unique.length === 0) {
    throw new BadRequestException(
      'Select at least one allowed MIME type for this report',
    );
  }

  const invalid = unique.filter((mime) => !allowed.has(mime));

  if (invalid.length > 0) {
    throw new BadRequestException(
      `Unsupported MIME types for ${type}: ${invalid.join(', ')}`,
    );
  }

  if (maxFiles === undefined || maxFiles === null) {
    throw new BadRequestException(
      'A maximum number of files is required for this report',
    );
  }

  if (!Number.isInteger(maxFiles) || maxFiles < 1) {
    throw new BadRequestException(
      'The maximum number of files must be a positive integer',
    );
  }

  return { allowedMimeTypes: unique, maxFiles };
}

export function resolveReportConfigUpdate(
  existing: {
    type: ReportContentKind;
    allowedMimeTypes: string[];
    maxFiles: number | null;
  },
  data: UpdateReportDto,
): {
  type: ReportContentKind;
  allowedMimeTypes: string[];
  maxFiles: number | null;
} {
  const nextType = data.type ?? existing.type;

  let nextAllowed = data.allowedMimeTypes ?? existing.allowedMimeTypes;
  let nextMax = data.maxFiles ?? existing.maxFiles;

  if (data.type !== undefined && data.type !== existing.type) {
    if (!isFileReportType(nextType)) {
      if (data.allowedMimeTypes === undefined) {
        nextAllowed = [];
      }

      if (data.maxFiles === undefined) {
        nextMax = null;
      }
    } else if (!isFileReportType(existing.type)) {
      nextAllowed = data.allowedMimeTypes ?? [];
      nextMax = data.maxFiles ?? null;
    }
  }

  const config = validateReportConfig(nextType, nextAllowed, nextMax);

  return { type: nextType, ...config };
}
