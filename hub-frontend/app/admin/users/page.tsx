"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/auth-provider";
import { getUsers, AuthUser } from "../../services/auth";
import ModuleHeader from "../../components/module-header";
import CreateUserDialog from "./create-user-dialog";
import EditUserRolesDialog from "./edit-user-roles-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRole } from "../../services/utils";

export default function AdminUsersPage() {
  const router = useRouter();
  const { session, ready, isAuthenticated } = useAuth();

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const isAdmin = session?.user.roles.includes("admin");

    if (!isAdmin) {
      router.replace("/");
      return;
    }

    async function loadUsers() {
      try {
        setLoading(true);
        setError(null);

        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los usuarios.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [ready, isAuthenticated, session, router]);

  if (!ready || loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="utb-skeleton h-44 w-full rounded-3xl" />
      </main>
    );
  }

  if (!isAuthenticated || !session?.user.roles.includes("admin")) {
    return null;
  }

  return (
    <main className="flex-1 text-foreground">
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <ModuleHeader
          eyebrow="Administración"
          title="Panel del administrador"
          subtitle="Gestión de usuarios y roles del sistema."
          accentColor="rgba(129,140,248,0.38)"
        />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>
              Usuarios registrados en CapstoneHUB.
            </CardDescription>
            <CardAction>
              <CreateUserDialog
                onUserCreated={(user) => {
                  setUsers((currentUsers) => [...currentUsers, user]);
                }}
              />
            </CardAction>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No hay usuarios registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="transition-colors hover:bg-utb-blue/[0.04]">
                      <TableCell className="font-medium">
                        {user.fullName}
                      </TableCell>

                      <TableCell>{user.email}</TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {user.roles.map((role) => (
                            <Badge key={role} variant="outline">
                              {formatRole(role)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <EditUserRolesDialog
                          user={user}
                          onUserUpdated={(updatedUser) => {
                            setUsers((currentUsers) =>
                              currentUsers.map((currentUser) =>
                                currentUser.id === updatedUser.id
                                  ? updatedUser
                                  : currentUser,
                              ),
                            );
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
