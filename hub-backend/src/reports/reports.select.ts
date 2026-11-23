import {
  Prisma,
  ReportContentKind,
  ReportStatus,
} from '../generated/prisma/client';
import {
  ProjectAttachmentResponse,
  attachmentSelect,
  mapAttachment,
} from '../attachments/attachments.select';

const reportUserSelect = {
  id: true,
  fullName: true,
  email: true,
} as const satisfies Prisma.UserSelect;

export type ReportUser = Prisma.UserGetPayload<{
  select: typeof reportUserSelect;
}>;

export const reportContentSelect = {
  id: true,
  reportId: true,
  kind: true,
  textContent: true,
  url: true,
  label: true,
  createdAt: true,
  attachment: { select: attachmentSelect },
  createdBy: { select: reportUserSelect },
} as const satisfies Prisma.ProjectReportContentSelect;

export type SelectedReportContent = Prisma.ProjectReportContentGetPayload<{
  select: typeof reportContentSelect;
}>;

export type ProjectReportContentResponse = {
  id: number;
  reportId: number;
  kind: ReportContentKind;
  textContent: string | null;
  url: string | null;
  label: string | null;
  createdAt: Date;
  attachment: ProjectAttachmentResponse | null;
  createdBy: ReportUser | null;
};

export function mapReportContent(
  content: SelectedReportContent,
): ProjectReportContentResponse {
  return {
    id: content.id,
    reportId: content.reportId,
    kind: content.kind,
    textContent: content.textContent,
    url: content.url,
    label: content.label,
    createdAt: content.createdAt,
    attachment: content.attachment ? mapAttachment(content.attachment) : null,
    createdBy: content.createdBy,
  };
}

export const reportSelect = {
  id: true,
  projectId: true,
  title: true,
  description: true,
  dueDate: true,
  type: true,
  allowedMimeTypes: true,
  maxFiles: true,
  status: true,
  submittedAt: true,
  reviewedAt: true,
  reviewComment: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: reportUserSelect },
  reviewedBy: { select: reportUserSelect },
  contents: {
    select: reportContentSelect,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
} as const satisfies Prisma.ProjectReportSelect;

export type SelectedReport = Prisma.ProjectReportGetPayload<{
  select: typeof reportSelect;
}>;

export type ProjectReportResponse = {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  dueDate: Date;
  type: ReportContentKind;
  allowedMimeTypes: string[];
  maxFiles: number | null;
  status: ReportStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewComment: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ReportUser | null;
  reviewedBy: ReportUser | null;
  /** `false` mientras el contenido está oculto por no haberse enviado. */
  canViewContents: boolean;
  /** Indica si existe contenido aunque `contents` venga oculto. */
  hasContents: boolean;
  contents: ProjectReportContentResponse[];
};

/** Estados en los que el estudiante aún puede editar el contenido. */
export function isDraftReportStatus(status: ReportStatus): boolean {
  return status === ReportStatus.pending || status === ReportStatus.rejected;
}

export function mapReport(
  report: SelectedReport,
  canViewDraftContents = false,
): ProjectReportResponse {
  const canViewContents =
    !isDraftReportStatus(report.status) || canViewDraftContents;

  return {
    id: report.id,
    projectId: report.projectId,
    title: report.title,
    description: report.description,
    dueDate: report.dueDate,
    type: report.type,
    allowedMimeTypes: report.allowedMimeTypes,
    maxFiles: report.maxFiles,
    status: report.status,
    submittedAt: report.submittedAt,
    reviewedAt: report.reviewedAt,
    reviewComment: report.reviewComment,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    createdBy: report.createdBy,
    reviewedBy: report.reviewedBy,
    canViewContents,
    hasContents: report.contents.length > 0,
    contents: canViewContents ? report.contents.map(mapReportContent) : [],
  };
}
