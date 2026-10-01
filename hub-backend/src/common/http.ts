import { BadRequestException } from '@nestjs/common';

/**
 * Construye el header `Content-Disposition` con un nombre ASCII de respaldo y el
 * nombre real codificado en UTF-8.
 */
export function contentDisposition(
  filename: string,
  disposition: 'attachment' | 'inline' = 'attachment',
): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');

  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(
    filename,
  )}`;
}

/**
 * Acepta un único rango (`bytes=0-`, `bytes=500-1000`) y lo reenvía tal cual al
 * almacenamiento. Los rangos múltiples se rechazan porque S3 no los soporta.
 */
export function normalizeRangeHeader(
  value: string | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  const match = /^bytes=(\d*)-(\d*)$/.exec(trimmed);

  if (!match || (match[1] === '' && match[2] === '')) {
    throw new BadRequestException('Invalid Range header');
  }

  return trimmed;
}
