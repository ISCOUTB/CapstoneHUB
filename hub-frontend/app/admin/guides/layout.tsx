"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/auth-provider";
import { canManageGuides } from "../../services/roles";

export default function GuidesAdminLayout({
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
      router.replace("/login?next=/admin/guides");
      return;
    }

    if (!canManageGuides(session?.user.roles ?? [])) {
      router.replace("/");
    }
  }, [ready, isAuthenticated, session, router]);

  if (!ready || !session || !canManageGuides(session.user.roles)) {
    return null;
  }

  return <>{children}</>;
}
