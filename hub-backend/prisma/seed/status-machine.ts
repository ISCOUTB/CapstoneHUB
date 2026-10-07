import { ProjectStatus } from '../../src/generated/prisma/client';

/** Camino lineal del "happy path" (sin los estados laterales paused/cancelled). */
export const STATUS_SEQUENCE: ProjectStatus[] = [
  'proposed',
  'under_review',
  'approved',
  'in_progress',
  'closed',
];

/** Caminos laterales hasta un estado que no está en la secuencia lineal. */
const SIDE_PATHS: Partial<Record<ProjectStatus, ProjectStatus[]>> = {
  rejected: ['proposed', 'rejected'],
  paused: ['proposed', 'under_review', 'approved', 'in_progress', 'paused'],
  cancelled: [
    'proposed',
    'under_review',
    'approved',
    'in_progress',
    'cancelled',
  ],
};

export function statusPathFor(target: ProjectStatus): ProjectStatus[] {
  const sidePath = SIDE_PATHS[target];
  if (sidePath) {
    return sidePath;
  }

  const index = STATUS_SEQUENCE.indexOf(target);
  if (index < 0) {
    return ['proposed'];
  }

  return STATUS_SEQUENCE.slice(0, index + 1);
}

/**
 * Mirrors AuthorizationService.assertCanTransitionProject: evaluators handle
 * review transitions and rejections, coordinators handle the rest.
 */
export function authorRoleForTransition(
  previous: ProjectStatus,
  next: ProjectStatus,
): 'evaluator' | 'coordinator' {
  if (
    previous === 'proposed' ||
    previous === 'under_review' ||
    (previous === 'approved' && next === 'rejected')
  ) {
    return 'evaluator';
  }

  return 'coordinator';
}
