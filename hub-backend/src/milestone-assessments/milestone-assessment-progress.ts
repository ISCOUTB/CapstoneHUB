import {
  findMilestoneAssessmentTemplate,
  templateItems,
  type MilestoneAssessmentAnswers,
} from './milestone-assessment-templates';

export type MilestoneAssessmentSummary = {
  totalItems: number;
  answeredItems: number;
  yes: number;
  no: number;
  na: number;
  pending: number;
};

export const EMPTY_MILESTONE_ASSESSMENT_SUMMARY: MilestoneAssessmentSummary = {
  totalItems: 0,
  answeredItems: 0,
  yes: 0,
  no: 0,
  na: 0,
  pending: 0,
};

export function parseMilestoneAssessmentAnswers(
  value: unknown,
): MilestoneAssessmentAnswers {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([itemId, itemValue]) => {
      if (
        typeof itemValue !== 'object' ||
        itemValue === null ||
        Array.isArray(itemValue)
      ) {
        return [];
      }

      const answer = itemValue as { status?: unknown; observation?: unknown };
      return [
        [
          itemId,
          {
            status: ['yes', 'no', 'na'].includes(answer.status as string)
              ? (answer.status as 'yes' | 'no' | 'na')
              : null,
            observation:
              typeof answer.observation === 'string' ? answer.observation : '',
          },
        ],
      ];
    }),
  );
}

export function summarizeMilestoneAssessment(
  programId: string,
  answersValue: unknown,
): MilestoneAssessmentSummary {
  const template = findMilestoneAssessmentTemplate(programId);
  if (!template) {
    return { ...EMPTY_MILESTONE_ASSESSMENT_SUMMARY };
  }

  const answers = parseMilestoneAssessmentAnswers(answersValue);
  const summary: MilestoneAssessmentSummary = {
    totalItems: 0,
    answeredItems: 0,
    yes: 0,
    no: 0,
    na: 0,
    pending: 0,
  };

  for (const item of templateItems(template)) {
    summary.totalItems += 1;
    const status = answers[item.id]?.status ?? null;
    if (status === null) {
      summary.pending += 1;
      continue;
    }

    summary.answeredItems += 1;
    summary[status] += 1;
  }

  return summary;
}

export function summarizeProjectMilestoneAssessments(
  programIds: readonly string[],
  assessments: readonly { programId: string; answers: unknown }[],
): { totalItems: number; answeredItems: number } {
  const byProgram = new Map(
    assessments.map((assessment) => [assessment.programId, assessment]),
  );

  return programIds.reduce(
    (total, programId) => {
      const summary = summarizeMilestoneAssessment(
        programId,
        byProgram.get(programId)?.answers,
      );
      return {
        totalItems: total.totalItems + summary.totalItems,
        answeredItems: total.answeredItems + summary.answeredItems,
      };
    },
    { totalItems: 0, answeredItems: 0 },
  );
}
