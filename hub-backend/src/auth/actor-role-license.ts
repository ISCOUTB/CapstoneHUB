import { ActorRole, UserRole } from '../generated/prisma/client';

/**
 * Roles globales que habilitan cada rol dentro de un proyecto. Se comprueba una
 * sola vez, al asignar al actor; a partir de ese momento los permisos dependen
 * de la asignación al proyecto y no del rol global.
 */
export const ACTOR_ROLE_LICENSES: Record<ActorRole, UserRole[]> = {
  [ActorRole.teacher]: [UserRole.teacher],
  [ActorRole.evaluator]: [
    UserRole.teacher,
    UserRole.evaluator,
    UserRole.directivo,
  ],
  [ActorRole.student]: [UserRole.student],
};

export function hasActorRoleLicense(
  globalRoles: readonly UserRole[],
  actorRole: ActorRole,
): boolean {
  return globalRoles.some((role) =>
    ACTOR_ROLE_LICENSES[actorRole].includes(role),
  );
}
