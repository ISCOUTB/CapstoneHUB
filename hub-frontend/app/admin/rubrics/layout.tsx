"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/auth-provider";
import { canManageRubrics } from "../../services/roles";

export default function RubricsAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { session, ready, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login?next=/admin/rubrics");
      return;
    }

    if (!canManageRubrics(session?.user.roles ?? [])) {
      router.replace("/");
    }
  }, [ready, isAuthenticated, session, router]);

  if (!ready || !session || !canManageRubrics(session.user.roles)) {
    return null;
  }

  return <>{children}</>;
}
