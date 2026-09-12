export type UserRole =
  | "admin"
  | "evaluator"
  | "coordinator"
  | "advisor"
  | "student";

export function hasRole(
  roles: string[] | undefined,
  role: UserRole,
): boolean {
  return roles?.includes(role) ?? false;
}

export function isAdmin(roles: string[] | undefined): boolean {
  return hasRole(roles, "admin");
}

export function isEvaluator(roles: string[] | undefined): boolean {
  return hasRole(roles, "evaluator");
}

export function isCoordinator(roles: string[] | undefined): boolean {
  return hasRole(roles, "coordinator");
}

export function isAdvisor(roles: string[] | undefined): boolean {
  return hasRole(roles, "advisor");
}

export function isStudent(roles: string[] | undefined): boolean {
  return hasRole(roles, "student");
}

export function canAssignStudents(
  roles: string[] | undefined,
): boolean {
  return (
    isAdmin(roles) ||
    isEvaluator(roles) ||
    isCoordinator(roles)
  );
}

export function canAssignActors(
  roles: string[] | undefined,
): boolean {
  return (
    isAdmin(roles) ||
    isEvaluator(roles)
  );
}

export function canManageProject(
  roles: string[] | undefined,
): boolean {
  return (
    isAdmin(roles) ||
    isEvaluator(roles)
  );
}

export function canProvideFeedback(
  roles: string[] | undefined,
): boolean {
  return (
    isAdmin(roles) ||
    isEvaluator(roles) ||
    isCoordinator(roles) ||
    isAdvisor(roles)
  );
}