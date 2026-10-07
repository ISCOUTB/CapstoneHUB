"use client";

import { useState } from "react";
import { RiFlagLine } from "@remixicon/react";
import { useAuth } from "./auth-provider";
import ProjectStatusEditForm, {
  canManageStatus,
} from "./project-status-edit-form";
import { ProjectMilestoneItem } from "../services/schemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ProjectAssignment = {
  userId: number;
  role: string;
};

type ProjectStatusDialogProps = {
  projectId: number;
  currentStatus: string;
  assignments: ProjectAssignment[];
  milestones?: ProjectMilestoneItem[];
  onProjectChange?: () => Promise<void>;
};


export default function ProjectStatusDialog({
  projectId,
  currentStatus,
  assignments,
  milestones = [],
  onProjectChange,
}: ProjectStatusDialogProps) {
  const { session, isAuthenticated, ready } = useAuth();
  const [open, setOpen] = useState(false);

  if (!ready || !isAuthenticated || !session) {
    return null;
  }

  const canManage = canManageStatus(
    session.user.id,
    session.user.roles,
    currentStatus,
    assignments,
  );

  if (!canManage) {
    return null;
  }

  async function handleProjectChange() {
    await onProjectChange?.();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <RiFlagLine data-icon="inline-start" />
        Actualizar estado
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Actualizar estado del proyecto</DialogTitle>
        </DialogHeader>

        <ProjectStatusEditForm
          projectId={projectId}
          currentStatus={currentStatus}
          assignments={assignments}
          milestones={milestones}
          onProjectChange={handleProjectChange}
        />
      </DialogContent>
    </Dialog>
  );
}
