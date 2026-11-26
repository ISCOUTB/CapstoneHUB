import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma.service';
import { slugifyFileName } from '../projects/project-exports.labels';
import type { ProjectExportFile } from '../projects/project-exports.service';
import { ProjectsService } from '../projects/projects.service';
import { buildMilestoneReport } from './milestone-report.model';
import { buildMilestoneReportPdf } from './milestone-report.pdf';

@Injectable()
export class MilestoneReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly authorization: AuthorizationService,
  ) {}

  /**
   * Informe PDF de la evaluación de hitos. Combina el permiso de exportación
   * por rol global, la visibilidad del proyecto (404) y la gestión de hitos del
   * proyecto (403), para que los datos de hitos no lleguen a extraños.
   */
  async exportMilestoneReport(
    user: AuthenticatedUser,
    projectId: number,
  ): Promise<ProjectExportFile> {
    this.authorization.assertCanExportProjectData(user);

    const project = await this.projects.project({ id: projectId }, user);

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    await this.authorization.assertCanManageMilestoneAssessment(
      user,
      projectId,
    );

    const assessments = await this.prisma.projectMilestoneAssessment.findMany({
      where: { projectId },
      select: {
        programId: true,
        answers: true,
        updatedAt: true,
        updatedBy: { select: { fullName: true } },
      },
    });

    const generatedAt = new Date();
    const report = buildMilestoneReport({
      project,
      assessments: assessments.map((assessment) => ({
        programId: assessment.programId,
        answers: assessment.answers,
        updatedAt: assessment.updatedAt,
        updatedBy: assessment.updatedBy?.fullName ?? null,
      })),
      team: project.canViewSensitiveData
        ? project.actorAssignments.map((assignment) => ({
            fullName: assignment.user.fullName,
            role: assignment.role,
            email: assignment.user.email,
          }))
        : null,
      generatedAt,
      generatedBy: `${user.fullName} <${user.email}>`,
    });

    const buffer = await buildMilestoneReportPdf(report);

    return {
      buffer,
      fileName: `hitos-proyecto-${project.id}-${slugifyFileName(
        project.name,
        'proyecto',
      )}-${generatedAt.toISOString().slice(0, 10)}.pdf`,
    };
  }
}
