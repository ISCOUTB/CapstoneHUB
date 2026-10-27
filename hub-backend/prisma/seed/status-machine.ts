import { ProjectStatus } from '../../src/generated/prisma/client';

/** Camino lineal del "happy path" (sin los estados laterales paused/cancelled). */
export const STATUS_SEQUENCE: ProjectStatus[] = [
  'proposed',
  'approved',
  'in_progress',
  'closed',
];

/** Caminos laterales hasta un estado que no está en la secuencia lineal. */
const SIDE_PATHS: Partial<Record<ProjectStatus, ProjectStatus[]>> = {
  rejected: ['proposed', 'rejected'],
  paused: ['proposed', 'approved', 'in_progress', 'paused'],
  cancelled: ['proposed', 'approved', 'in_progress', 'cancelled'],
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
 * Mirrors AuthorizationService.assertCanTransitionProject: assigned evaluators
 * handle review transitions and rejections, teachers handle the rest.
 * `under_review` se conserva por los datos legados.
 */
export function authorRoleForTransition(
  previous: ProjectStatus,
  next: ProjectStatus,
): 'evaluator' | 'teacher' {
  if (
    previous === 'proposed' ||
    previous === 'under_review' ||
    (previous === 'approved' && next === 'rejected')
  ) {
    return 'evaluator';
  }

  return 'teacher';
}
