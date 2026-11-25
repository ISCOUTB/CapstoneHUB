import type {
  ActorRole,
  ProjectPhase,
  ProjectStatus,
} from '../generated/prisma/client';
import {
  parseMilestoneAssessmentAnswers,
  summarizeMilestoneAssessment,
  type MilestoneAssessmentSummary,
} from '../milestone-assessments/milestone-assessment-progress';
import {
  findMilestoneAssessmentTemplate,
  type MilestoneAssessmentAnswer,
  type MilestoneAssessmentAnswers,
  type MilestoneAssessmentItem,
  type MilestoneAssessmentTemplate,
} from '../milestone-assessments/milestone-assessment-templates';

export type MilestoneReportAnswerStatus = MilestoneAssessmentAnswer['status'];

export type MilestoneReportItem = {
  code: string;
  label: string;
  status: MilestoneReportAnswerStatus;
  observation: string;
};

export type MilestoneReportSection = {
  title: string;
  items: MilestoneReportItem[];
};

export type MilestoneReportProgram = {
  programId: string;
  programName: string;
  schoolName: string | null;
  studentCount: number;
  hasTemplate: boolean;
  introduction: string | null;
  notes: string[];
  sections: MilestoneReportSection[];
  summary: MilestoneAssessmentSummary;
  percent: number | null;
  updatedAt: Date | null;
  updatedBy: string | null;
};

export type MilestoneReportMember = {
  fullName: string;
  role: ActorRole;
  email: string;
};

export type MilestoneReport = {
  project: {
    id: number;
    name: string;
    status: ProjectStatus;
    phase: ProjectPhase;
  };
  programs: MilestoneReportProgram[];
  totals: MilestoneAssessmentSummary;
  percent: number | null;
  team: MilestoneReportMember[] | null;
  generatedAt: Date;
  generatedBy: string;
};

export type MilestoneReportInput = {
  project: {
    id: number;
    name: string;
    status: ProjectStatus;
    phase: ProjectPhase;
    programRequirements: {
      programId: string;
      programName: string;
      schoolName: string | null;
      studentCount: number;
    }[];
  };
  assessments: {
    programId: string;
    answers: unknown;
    updatedAt: Date;
    updatedBy: string | null;
  }[];
  team: MilestoneReportMember[] | null;
  generatedAt: Date;
  generatedBy: string;
};

type RequirementInput =
  MilestoneReportInput['project']['programRequirements'][number];
type AssessmentInput = MilestoneReportInput['assessments'][number];

export function buildMilestoneReport(
  input: MilestoneReportInput,
): MilestoneReport {
  const assessmentsByProgram = new Map(
    input.assessments.map((assessment) => [assessment.programId, assessment]),
  );

  const programs = input.project.programRequirements.map((requirement) =>
    buildProgram(requirement, assessmentsByProgram.get(requirement.programId)),
  );
  const totals = sumSummaries(programs.map((program) => program.summary));

  return {
    project: {
      id: input.project.id,
      name: input.project.name,
      status: input.project.status,
      phase: input.project.phase,
    },
    programs,
    totals,
    percent: percentOf(totals),
    team: input.team,
    generatedAt: input.generatedAt,
    generatedBy: input.generatedBy,
  };
}

function buildProgram(
  requirement: RequirementInput,
  saved: AssessmentInput | undefined,
): MilestoneReportProgram {
  const template = findMilestoneAssessmentTemplate(requirement.programId);
  const answers = parseMilestoneAssessmentAnswers(saved?.answers);
  const summary = summarizeMilestoneAssessment(
    requirement.programId,
    saved?.answers,
  );

  return {
    programId: requirement.programId,
    programName: requirement.programName,
    schoolName: requirement.schoolName,
    studentCount: requirement.studentCount,
    hasTemplate: template !== undefined,
    introduction: template?.introduction ?? null,
    notes: [...(template?.notes ?? [])],
    sections: template ? buildSections(template, answers) : [],
    summary,
    percent: percentOf(summary),
    updatedAt: saved?.updatedAt ?? null,
    updatedBy: saved?.updatedBy ?? null,
  };
}

function buildSections(
  template: MilestoneAssessmentTemplate,
  answers: MilestoneAssessmentAnswers,
): MilestoneReportSection[] {
  const toItem = (
    item: MilestoneAssessmentItem,
    code: string,
  ): MilestoneReportItem => ({
    code,
    label: item.label,
    status: answers[item.id]?.status ?? null,
    observation: answers[item.id]?.observation ?? '',
  });

  return [
    {
      title: 'Resumen general de hitos',
      items: template.overviewItems.map((item) => toItem(item, '')),
    },
    ...template.sections.map((section) => ({
      title: `${section.id}. ${section.title}`,
      items: section.items.map((item) => toItem(item, item.id)),
    })),
  ];
}

function sumSummaries(
  summaries: MilestoneAssessmentSummary[],
): MilestoneAssessmentSummary {
  return summaries.reduce<MilestoneAssessmentSummary>(
    (total, summary) => ({
      totalItems: total.totalItems + summary.totalItems,
      answeredItems: total.answeredItems + summary.answeredItems,
      yes: total.yes + summary.yes,
      no: total.no + summary.no,
      na: total.na + summary.na,
      pending: total.pending + summary.pending,
    }),
    { totalItems: 0, answeredItems: 0, yes: 0, no: 0, na: 0, pending: 0 },
  );
}

function percentOf(summary: MilestoneAssessmentSummary): number | null {
  return summary.totalItems > 0
    ? Math.round((summary.answeredItems / summary.totalItems) * 100)
    : null;
}
