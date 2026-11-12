import { positiveInt } from '../common/env';

/**
 * Tope para los archivos del catálogo de guías. Se puede ajustar con
 * `MAX_GUIDE_FILE_SIZE_BYTES`; por defecto 25 MB.
 */
export const MAX_GUIDE_FILE_SIZE_BYTES = positiveInt(
  process.env.MAX_GUIDE_FILE_SIZE_BYTES,
  25 * 1024 * 1024,
);

/** Documentos admitidos en el catálogo de guías. */
export const GUIDE_DOCUMENT_MIME_TYPES: ReadonlySet<string> = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
]);
