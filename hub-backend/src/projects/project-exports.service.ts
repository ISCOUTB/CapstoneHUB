import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from '../auth/authorization.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { ProjectsService } from './projects.service';
import { buildProjectsExcel } from './project-exports.excel';
import { slugifyFileName } from './project-exports.labels';
import { buildProjectPdf } from './project-exports.pdf';

export type ProjectExportFile = {
  buffer: Buffer;
  fileName: string;
};

@Injectable()
export class ProjectExportsService {
  constructor(
    private readonly projects: ProjectsService,
    private readonly authorization: AuthorizationService,
  ) {}

  /**
   * Libro general con todos los proyectos visibles para el usuario. No aplica
   * los filtros de la lista: es el panorama completo solicitado en #195.
   */
  async exportProjectsExcel(
    user: AuthenticatedUser,
  ): Promise<ProjectExportFile> {
    this.authorization.assertCanExportProjectData(user);

    const projects = await this.projects.listProjectsForExport(user);
    const generatedAt = new Date();
    const buffer = await buildProjectsExcel(projects, {
      generatedAt,
      generatedBy: `${user.fullName} <${user.email}>`,
    });

    return {
      buffer,
      fileName: `capstonehub-proyectos-${generatedAt.toISOString().slice(0, 10)}.xlsx`,
    };
  }

  /**
   * PDF de información general del proyecto. Reutiliza `project()` para que
   * la visibilidad y el redactado de datos sensibles coincidan con el detalle.
   */
  async exportProjectPdf(
    user: AuthenticatedUser,
    projectId: number,
  ): Promise<ProjectExportFile> {
    this.authorization.assertCanExportProjectData(user);

    const project = await this.projects.project({ id: projectId }, user);

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const buffer = await buildProjectPdf(project);

    return {
      buffer,
      fileName: `proyecto-${project.id}-${slugifyFileName(
        project.name,
        'detalle',
      )}.pdf`,
    };
  }
}
