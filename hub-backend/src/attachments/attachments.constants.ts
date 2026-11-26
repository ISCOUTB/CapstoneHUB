import { positiveInt } from '../common/env';

export const MAX_ATTACHMENT_SIZE_BYTES = positiveInt(
  process.env.MAX_FILE_SIZE_BYTES,
  10 * 1024 * 1024,
);

/**
 * Tope único para los archivos de una entrega (documentos, imágenes y videos).
 * Se mantiene `MAX_VIDEO_SIZE_BYTES` como fallback por compatibilidad.
 */
export const MAX_REPORT_FILE_SIZE_BYTES =
  positiveInt(process.env.MAX_REPORT_FILE_SIZE_BYTES, 0) ||
  positiveInt(process.env.MAX_VIDEO_SIZE_BYTES, 0) ||
  100 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIME_TYPES: ReadonlySet<string> = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
]);

/** Documentos admitidos como contenido de una entrega (`kind = file`). */
export const REPORT_DOCUMENT_MIME_TYPES: ReadonlySet<string> = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

/** Imágenes admitidas como contenido de una entrega (`kind = image`). */
export const REPORT_IMAGE_MIME_TYPES: ReadonlySet<string> = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

/** Videos reproducibles en el navegador (`kind = video`). */
export const REPORT_VIDEO_MIME_TYPES: ReadonlySet<string> = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
]);

/** Archivos comprimidos admitidos como contenido de una entrega. */
export const REPORT_ARCHIVE_MIME_TYPES: ReadonlySet<string> = new Set([
  'application/zip',
  'application/x-zip-compressed',
]);

/** Unión admitida para el tipo de entrega `file` (documentos, imágenes, videos y ZIP). */
export const REPORT_FILE_MIME_TYPES: ReadonlySet<string> = new Set([
  ...REPORT_DOCUMENT_MIME_TYPES,
  ...REPORT_IMAGE_MIME_TYPES,
  ...REPORT_VIDEO_MIME_TYPES,
  ...REPORT_ARCHIVE_MIME_TYPES,
]);
