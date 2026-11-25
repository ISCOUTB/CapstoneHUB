import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  ActorRole,
  ProjectPhase,
  ProjectStatus,
  UserRole,
} from '../generated/prisma/client';
import { AuthorizationService } from '../auth/authorization.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { ProjectDetailResponse } from '../projects/projects.select';
import { MilestoneReportService } from './milestone-report.service';

const user: AuthenticatedUser = {
  id: 7,
  fullName: 'Docente Demo',
  email: 'docente@example.com',
  roles: [UserRole.teacher],
};

const detailProject = {
  id: 1,
  name: 'Proyecto Demo',
  status: ProjectStatus.in_progress,
  phase: ProjectPhase.semester_1,
  programRequirements: [
    {
      id: 1,
      programId: 'ingenieria-industrial',
      programName: 'Ingeniería Industrial',
      schoolId: 'ingenieria-arquitectura-diseno',
      schoolName: 'Escuela de Ingeniería, Arquitectura & Diseño',
      studentCount: 2,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
  ],
  actorAssignments: [
    {
      id: 1,
      projectId: 1,
      userId: 7,
      role: ActorRole.teacher,
      assignedAt: new Date('2026-02-01T00:00:00Z'),
      user: { id: 7, fullName: 'Docente Demo', email: 'docente@example.com' },
    },
  ],
  canViewSensitiveData: true,
} as unknown as ProjectDetailResponse;

function createService() {
  const assertCanExportProjectData = jest.fn();
  const assertCanManageMilestoneAssessment = jest
    .fn()
    .mockResolvedValue(undefined);
  const project = jest.fn().mockResolvedValue(detailProject);
  const findMany = jest.fn().mockResolvedValue([
    {
      programId: 'ingenieria-industrial',
      answers: { 'overview-1': { status: 'yes', observation: 'Cumple' } },
      updatedAt: new Date('2026-11-20T10:00:00Z'),
      updatedBy: { fullName: 'Docente Demo' },
    },
  ]);

  const service = new MilestoneReportService(
    { projectMilestoneAssessment: { findMany } } as unknown as PrismaService,
    { project } as unknown as ProjectsService,
    {
      assertCanExportProjectData,
      assertCanManageMilestoneAssessment,
    } as unknown as AuthorizationService,
  );

  return {
    service,
    project,
    findMany,
    assertCanExportProjectData,
    assertCanManageMilestoneAssessment,
  };
}

describe('MilestoneReportService', () => {
  it('genera el informe PDF con el nombre del proyecto y la fecha', async () => {
    const { service, project, findMany, assertCanManageMilestoneAssessment } =
      createService();

    const file = await service.exportMilestoneReport(user, 1);

    expect(project).toHaveBeenCalledWith({ id: 1 }, user);
    expect(assertCanManageMilestoneAssessment).toHaveBeenCalledWith(user, 1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { projectId: 1 } }),
    );
    expect(file.fileName).toMatch(
      /^hitos-proyecto-1-proyecto-demo-\d{4}-\d{2}-\d{2}\.pdf$/,
    );
    expect(file.buffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('no consulta el proyecto cuando el rol no puede exportar', async () => {
    const { service, project, assertCanExportProjectData } = createService();
    assertCanExportProjectData.mockImplementationOnce(() => {
      throw new ForbiddenException();
    });

    await expect(service.exportMilestoneReport(user, 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(project).not.toHaveBeenCalled();
  });

  it('devuelve 404 cuando el proyecto no es visible', async () => {
    const { service, project, assertCanManageMilestoneAssessment } =
      createService();
    project.mockResolvedValueOnce(null);

    await expect(
      service.exportMilestoneReport(user, 99),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(assertCanManageMilestoneAssessment).not.toHaveBeenCalled();
  });

  it('rechaza a quien no gestiona los hitos del proyecto sin leer las evaluaciones', async () => {
    const { service, findMany, assertCanManageMilestoneAssessment } =
      createService();
    assertCanManageMilestoneAssessment.mockRejectedValueOnce(
      new ForbiddenException(),
    );

    await expect(service.exportMilestoneReport(user, 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(findMany).not.toHaveBeenCalled();
  });
});
