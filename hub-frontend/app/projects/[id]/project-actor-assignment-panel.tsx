"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProjectActorAssignment, getUsers } from "../../services/projects";
import { UserSummary } from "../../services/schemas";
import { useAuth } from "../../components/auth-provider";
import Link from "next/link";

const roles = [
  { value: "advisor", label: "Asesor" },
  { value: "coordinator", label: "Coordinator" },
  { value: "student", label: "Student" },
  { value: "evaluator", label: "Evaluator" },
] as const;

type ProjectActorRole = (typeof roles)[number]["value"];

type ProjectActorAssignmentPanelProps = {
  projectId: number;
  assignments: {
    id: number;
    projectId: number;
    userId: number;
    role: string;
    assignedAt: string;
    user: {
      id: number;
      fullName: string;
      email: string;
    };
  }[];
};

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

export default function ProjectActorAssignmentPanel({
  projectId,
  assignments,
}: ProjectActorAssignmentPanelProps) {
  const router = useRouter();
  const { isAuthenticated, ready } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProjectActorRole>(
    roles[0].value,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!ready || !isAuthenticated || users.length > 0) {
      return;
    }

    void getUsers().then(({ users: nextUsers, error }) => {
      if (error) {
        setErrorMessage(error);
        return;
      }

      setUsers(nextUsers);
      if (nextUsers.length > 0) {
        setSelectedUserId(String(nextUsers[0].id));
      }
    });
  }, [isAuthenticated, ready, users.length]);

  const assignedUsers = assignments;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!selectedUserId) {
      setErrorMessage("Selecciona un usuario.");
      return;
    }

    startTransition(async () => {
      try {
        await addProjectActorAssignment(projectId, {
          userId: Number(selectedUserId),
          role: selectedRole,
        });
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo asignar el usuario",
        );
      }
    });
  }

  if (!ready) {
    return (
      <div className="mt-6 border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Cargando acceso...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mt-6 border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Inicia sesión para asignar usuarios al proyecto.
        <div className="mt-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <form
        onSubmit={handleSubmit}
        className="border border-slate-200 bg-slate-50 p-4"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label
              htmlFor="userId"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              Usuario
            </label>
            <select
              id="userId"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
            >
              {users.length === 0 ? (
                <option value="">No hay usuarios disponibles</option>
              ) : (
                users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="role"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              Rol
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(event) =>
                setSelectedRole(event.target.value as ProjectActorRole)
              }
              className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isPending || users.length === 0}
            className="inline-flex items-center justify-center bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Asignando..." : "Asignar"}
          </button>
        </div>

        {errorMessage ? (
          <p className="mt-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
      </form>

      <div className="bg-white">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Usuarios asignados
        </h3>

        <div className="mt-4 space-y-3">
          {assignedUsers.length === 0 ? (
            <p className="text-sm text-slate-600">
              No hay usuarios asignados todavía.
            </p>
          ) : (
            assignedUsers.map((assignment) => (
              <div
                key={assignment.id}
                className="border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">
                    {assignment.user.fullName}
                  </p>
                  <span className="inline-flex w-fit bg-blue-400 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800">
                    {assignment.role}
                  </span>
                </div>
                <p className="mt-1 text-slate-600">{assignment.user.email}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Asignado el {formatDate(assignment.assignedAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
