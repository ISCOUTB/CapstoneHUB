/**
 * Vocabulario único de roles del frontend. Los globales identifican a la
 * persona en la institución; los de proyecto, lo que hace en un proyecto.
 * El backend vuelve a validar cada permiso.
 */

export const USER_ROLES = [
  "admin",
  "directivo",
  "evaluator",
  "teacher",
  "proposer",
  "student",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ACTOR_ROLES = ["teacher", "evaluator", "student"] as const;

export type ActorRole = (typeof ACTOR_ROLES)[number];

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export function isActorRole(value: string): value is ActorRole {
  return (ACTOR_ROLES as readonly string[]).includes(value);
}

/**
 * Roles de proyecto que puede recibir un usuario según sus roles globales.
 * Un docente puede participar como docente o como evaluador; un evaluador de
 * expo o un directivo, solo como evaluador; un estudiante, solo como
 * estudiante.
 */
export function assignableActorRoles(
  globalRoles: readonly string[],
): ActorRole[] {
  const roles: ActorRole[] = [];

  if (globalRoles.includes("teacher")) {
    roles.push("teacher", "evaluator");
  } else if (
    globalRoles.includes("evaluator") ||
    globalRoles.includes("directivo")
  ) {
    roles.push("evaluator");
  }

  if (globalRoles.includes("student")) {
    roles.push("student");
  }

  return roles;
}
