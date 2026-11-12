import request from 'supertest';
import ExcelJS from 'exceljs';
import { useTestApp } from './helpers/e2e';
import {
  adminSession,
  bearer,
  registerUser,
  uniqueEmail,
  userWithRole,
} from './helpers/auth';
import {
  assignProjectActor,
  createProject,
  createProjectWithProposer,
  transitionProjectStatus,
} from './helpers/projects';
import {
  ActorRole,
  ProjectStatus,
  UserRole,
} from '../src/generated/prisma/client';

function parseBinary(
  response: request.Response,
  callback: (error: Error | null, body: Buffer) => void,
): void {
  const chunks: Buffer[] = [];

  response.on('data', (chunk: Buffer) => chunks.push(chunk));
  response.on('end', () => callback(null, Buffer.concat(chunks)));
}

describe('Project exports (e2e)', () => {
  const getApp = useTestApp();

  it('exports the overview as Excel for admin, directivo and teacher', async () => {
    const app = getApp();
    const sessions = [
      await adminSession(app),
      await userWithRole(app, UserRole.directivo),
      await userWithRole(app, UserRole.teacher),
    ];

    for (const session of sessions) {
      const response = await request(app.getHttpServer())
        .get('/projects/export/excel')
        .set(bearer(session.accessToken))
        .buffer(true)
        .parse(parseBinary)
        .expect(200);

      expect(response.headers['content-type']).toContain('spreadsheetml');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-length']).toBeDefined();
      expect((response.body as Buffer).subarray(0, 2).toString()).toBe('PK');
    }
  });

  it('rejects evaluator and student roles', async () => {
    const app = getApp();
    const sessions = [
      await userWithRole(app, UserRole.evaluator),
      await userWithRole(app, UserRole.student),
    ];

    for (const session of sessions) {
      await request(app.getHttpServer())
        .get('/projects/export/excel')
        .set(bearer(session.accessToken))
        .expect(403);

      await request(app.getHttpServer())
        .get('/projects/1/export/pdf')
        .set(bearer(session.accessToken))
        .expect(403);
    }
  });

  it('includes projects and their current statuses in the Excel', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const proposer = await registerUser(app, uniqueEmail('export-proposer'));

    await createProject(app, proposer.accessToken, {
      name: 'Proyecto Export Propuesto',
    });
    const second = await createProject(app, proposer.accessToken, {
      name: 'Proyecto Export Aprobado',
    });

    await transitionProjectStatus(
      app,
      second.id,
      admin.accessToken,
      ProjectStatus.approved,
    );

    const response = await request(app.getHttpServer())
      .get('/projects/export/excel')
      .set(bearer(admin.accessToken))
      .buffer(true)
      .parse(parseBinary)
      .expect(200);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(response.body as Buffer);
    const sheet = workbook.getWorksheet('Proyectos');
    expect(sheet).toBeDefined();

    const rows: { name: string; status: string }[] = [];

    sheet?.eachRow((row, rowNumber) => {
      if (rowNumber < 4) {
        return;
      }

      rows.push({
        name: row.getCell(2).text,
        status: row.getCell(3).text,
      });
    });

    expect(rows).toEqual(
      expect.arrayContaining([
        { name: 'Proyecto Export Propuesto', status: 'Propuesto' },
        { name: 'Proyecto Export Aprobado', status: 'Aprobado' },
      ]),
    );
    expect(workbook.getWorksheet('Resumen')).toBeDefined();
  });

  it('lets a directivo download the PDF of a private project', async () => {
    const app = getApp();
    const directivo = await userWithRole(app, UserRole.directivo);
    const { projectId } = await createProjectWithProposer(app, true);

    const response = await request(app.getHttpServer())
      .get(`/projects/${projectId}/export/pdf`)
      .set(bearer(directivo.accessToken))
      .buffer(true)
      .parse(parseBinary)
      .expect(200);

    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect((response.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');
  });

  it('returns 404 for a private project the teacher cannot see', async () => {
    const app = getApp();
    const teacher = await userWithRole(app, UserRole.teacher);
    const { projectId } = await createProjectWithProposer(app, true);

    await request(app.getHttpServer())
      .get(`/projects/${projectId}/export/pdf`)
      .set(bearer(teacher.accessToken))
      .expect(404);
  });

  it('lets an assigned teacher download the PDF of a private project', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const teacher = await userWithRole(app, UserRole.teacher);
    const { projectId } = await createProjectWithProposer(app, true);

    await assignProjectActor(
      app,
      projectId,
      admin.accessToken,
      teacher.user.id,
      ActorRole.teacher,
    );

    const response = await request(app.getHttpServer())
      .get(`/projects/${projectId}/export/pdf`)
      .set(bearer(teacher.accessToken))
      .buffer(true)
      .parse(parseBinary)
      .expect(200);

    expect((response.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');
  });
});
