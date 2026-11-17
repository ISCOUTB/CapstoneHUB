import { ForbiddenException, NotFoundException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import {
  ActorRole,
  Prisma,
  ProjectPhase,
  ProjectSource,
  ProjectStatus,
  UserRole,
} from '../generated/prisma/client';
import { AuthorizationService } from '../auth/authorization.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { ProjectExportsService } from './project-exports.service';
import { ProjectsService } from './projects.service';
import { ProjectDetailResponse, ProjectListResponse } from './projects.select';

const user: AuthenticatedUser = {
  id: 7,
  fullName: 'Docente Demo',
  email: 'docente@example.com',
  roles: [UserRole.teacher],
};

const listProject: ProjectListResponse = {
  id: 1,
  name: 'Proyecto Demo',
  status: ProjectStatus.approved,
  phase: ProjectPhase.semester_1,
  startDate: new Date('2026-01-15T00:00:00Z'),
  location: 'Cartagena',
  requiresLegalization: true,
  isPrivate: true,
  source: ProjectSource.external_entity,
  sourceDetails: 'Empresa externa',
  programRequirements: [
    {
      id: 1,
      programId: 'systems',
      programName: 'Ingeniería de Sistemas',
      schoolId: 'engineering',
      schoolName: 'Ingeniería',
      studentCount: 3,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
  ],
  proposer: {
    type: 'natural_person',
    fullName: 'Ana Proponente',
    idNumber: '123456',
    email: 'ana@example.com',
  },
  actors: [
    {
      id: 1,
      userId: 8,
      role: ActorRole.teacher,
      assignedAt: new Date('2026-02-01T00:00:00Z'),
      user: {
        id: 8,
        fullName: 'Docente Asignado',
        email: 'asignado@example.com',
      },
    },
  ],
  canViewSensitiveData: true,
  isPrivatePreview: false,
};

const detailProject: ProjectDetailResponse = {
  ...listProject,
  description: 'Descripción del proyecto',
  context: 'Contexto del proyecto',
  endDate: new Date('2026-12-15T00:00:00Z'),
  estimatedCost: new Prisma.Decimal(1500000),
  facultyAdvisor: 'Asesor de facultad',
  facultyAdvisors: ['Asesor de facultad'],
  engineeringArea: 'systems',
  externalAdvisorName: 'Asesor externo',
  externalAdvisorEmail: 'externo@example.com',
  nit: '900123456',
  researchGroup: null,
  socialOrganization: null,
  socialLocation: null,
  projectScope: 'Alcance del proyecto',
  monetaryResources: 'yes',
  monetaryResourcesDescription: 'Recursos disponibles',
  teamRequirements: 'Conocimientos requeridos',
  expectedOutcomes: 'Resultados esperados',
  deliverables: [
    {
      id: 1,
      projectId: 1,
      description: 'Entregable principal',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
  ],
  isProposer: false,
  phaseApprovals: {
    nextPhase: ProjectPhase.semester_2,
    required: [],
  },
  evaluationGate: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-03-01T00:00:00Z'),
  observations: [],
  actorAssignments: [
    {
      id: 1,
      projectId: 1,
      userId: 8,
      role: ActorRole.teacher,
      assignedAt: new Date('2026-02-01T00:00:00Z'),
      user: {
        id: 8,
        fullName: 'Docente Asignado',
        email: 'asignado@example.com',
      },
    },
  ],
  milestones: [
    {
      id: 1,
      projectId: 1,
      title: 'Hito principal',
      description: null,
      dueDate: new Date('2026-06-15T00:00:00Z'),
      completed: false,
      isMinimum: true,
      phase: ProjectPhase.semester_1,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      reports: [],
    },
  ],
  statusHistory: [],
  changeHistory: [],
  attachments: [],
  reports: [],
  canExpressInterest: false,
  viewerInterest: null,
};

function createService() {
  const listProjectsForExport = jest.fn().mockResolvedValue([listProject]);
  const project = jest.fn().mockResolvedValue(detailProject);
  const assertCanExportProjectData = jest.fn();

  const projects = {
    listProjectsForExport,
    project,
  } as unknown as ProjectsService;
  const authorization = {
    assertCanExportProjectData,
  } as unknown as AuthorizationService;

  return {
    service: new ProjectExportsService(projects, authorization),
    listProjectsForExport,
    project,
    assertCanExportProjectData,
  };
}

describe('ProjectExportsService', () => {
  it('genera el Excel general con las hojas Proyectos y Resumen', async () => {
    const { service, listProjectsForExport, assertCanExportProjectData } =
      createService();

    const file = await service.exportProjectsExcel(user);

    expect(assertCanExportProjectData).toHaveBeenCalledWith(user);
    expect(listProjectsForExport).toHaveBeenCalledWith(user);
    expect(file.fileName).toMatch(
      /^capstonehub-proyectos-\d{4}-\d{2}-\d{2}\.xlsx$/,
    );
    expect(file.buffer.subarray(0, 2).toString()).toBe('PK');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Proyectos',
      'Resumen',
    ]);

    const sheet = workbook.getWorksheet('Proyectos');
    expect(sheet?.getCell('A3').value).toBe('ID');
    expect(sheet?.getCell('B4').value).toBe('Proyecto Demo');
    expect(sheet?.getCell('C4').value).toBe('Aprobado');
  });

  it('genera el PDF del proyecto con datos generales, equipo e hitos', async () => {
    const { service, project, assertCanExportProjectData } = createService();

    const file = await service.exportProjectPdf(user, 1);

    expect(assertCanExportProjectData).toHaveBeenCalledWith(user);
    expect(project).toHaveBeenCalledWith({ id: 1 }, user);
    expect(file.fileName).toBe('proyecto-1-proyecto-demo.pdf');
    expect(file.buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(file.buffer.length).toBeGreaterThan(1000);
  });

  it('devuelve 404 cuando el proyecto no es visible', async () => {
    const { service, project } = createService();
    project.mockResolvedValueOnce(null);

    await expect(service.exportProjectPdf(user, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('no consulta proyectos cuando el rol no puede exportar', async () => {
    const { service, listProjectsForExport, assertCanExportProjectData } =
      createService();
    assertCanExportProjectData.mockImplementationOnce(() => {
      throw new ForbiddenException();
    });

    await expect(service.exportProjectsExcel(user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(listProjectsForExport).not.toHaveBeenCalled();
  });
});
