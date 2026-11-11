import { GuideCategory, Prisma, UserRole } from '../generated/prisma/client';

export const guideDocumentSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  audiences: true,
  externalUrl: true,
  storageKey: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.GuideDocumentSelect;

export type SelectedGuideDocument = Prisma.GuideDocumentGetPayload<{
  select: typeof guideDocumentSelect;
}>;

export type GuideDocumentResponse = {
  id: number;
  title: string;
  description: string | null;
  category: GuideCategory;
  audiences: UserRole[];
  externalUrl: string | null;
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  isPublished: boolean;
  hasFile: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Expone solo los metadatos públicos del documento: `storageKey` se queda en
 * el servidor y se resume con `hasFile`.
 */
export function mapGuideDocument(
  document: SelectedGuideDocument,
): GuideDocumentResponse {
  return {
    id: document.id,
    title: document.title,
    description: document.description,
    category: document.category,
    audiences: document.audiences,
    externalUrl: document.externalUrl,
    originalName: document.originalName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    isPublished: document.isPublished,
    hasFile: Boolean(document.storageKey),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}
