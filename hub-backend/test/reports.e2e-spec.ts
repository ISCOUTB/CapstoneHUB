import request from 'supertest';
import { useTestApp } from './helpers/e2e';
import {
  adminSession,
  bearer,
  registerUser,
  uniqueEmail,
  userWithRole,
} from './helpers/auth';
import {
  addReportTextContent,
  createTextReport,
  submitReport,
} from './helpers/reports';
import {
  assignProjectActor,
  createProjectWithProposer,
  createProjectWithTeacherAndStudent,
  futureIsoDate,
  transitionProjectStatus,
} from './helpers/projects';
import {
  ActorRole,
  ProjectStatus,
  UserRole,
} from '../src/generated/prisma/client';

describe('Reports (e2e)', () => {
  const getApp = useTestApp();

  it('un directivo gestiona y revisa entregas y un estudiante asignado las envía', async () => {
    const app = getApp();
    const directivo = await userWithRole(app, UserRole.directivo);
    const student = await userWithRole(app, UserRole.student);
    const { projectId } = await createProjectWithProposer(app);

    // El directivo crea la entrega y asigna al estudiante sin estar asignado al
    // proyecto.
    const reportId = await createTextReport(
      app,
      projectId,
      directivo.accessToken,
    );
    await assignProjectActor(
      app,
      projectId,
      directivo.accessToken,
      student.user.id,
      ActorRole.student,
    );

    // El estudiante asignado prepara el contenido y envía la entrega.
    await addReportTextContent(
      app,
      projectId,
      reportId,
      student.accessToken,
      'Contenido de prueba',
    );
    await submitReport(app, projectId, reportId, student.accessToken);

    // El directivo la revisa sin asignación.
    const reviewed = await request(app.getHttpServer())
      .post(`/projects/${projectId}/reports/${reportId}/review`)
      .set(bearer(directivo.accessToken))
      .send({ decision: 'accepted', comment: 'Cumple con lo solicitado' })
      .expect(201);

    expect(reviewed.body).toMatchObject({ id: reportId, status: 'accepted' });
  });

  it('oculta el contenido de entregas sin enviar a docentes y lo muestra a estudiantes asignados', async () => {
    const app = getApp();
    const { projectId, admin, teacher, student } =
      await createProjectWithTeacherAndStudent(app);
    const reportId = await createTextReport(app, projectId, admin.accessToken);

    await addReportTextContent(
      app,
      projectId,
      reportId,
      student.accessToken,
      'Contenido privado',
    );

    type ReportBody = {
      id: number;
      canViewContents: boolean;
      hasContents: boolean;
      contents: { textContent: string | null }[];
    };

    const reportFrom = (body: unknown): ReportBody => {
      const report = (body as ReportBody[]).find(({ id }) => id === reportId);

      if (!report) {
        throw new Error(`Report ${reportId} not found in response`);
      }

      return report;
    };

    const teacherReports = await request(app.getHttpServer())
      .get(`/projects/${projectId}/reports`)
      .set(bearer(teacher.accessToken))
      .expect(200);

    expect(reportFrom(teacherReports.body)).toMatchObject({
      status: 'pending',
      canViewContents: false,
      hasContents: true,
      contents: [],
    });

    const studentReports = await request(app.getHttpServer())
      .get(`/projects/${projectId}/reports`)
      .set(bearer(student.accessToken))
      .expect(200);

    expect(reportFrom(studentReports.body)).toMatchObject({
      canViewContents: true,
      hasContents: true,
      contents: [expect.objectContaining({ textContent: 'Contenido privado' })],
    });

    const teacherDetail = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set(bearer(teacher.accessToken))
      .expect(200);

    expect(
      reportFrom((teacherDetail.body as { reports: unknown }).reports),
    ).toMatchObject({ contents: [] });

    const studentDetail = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set(bearer(student.accessToken))
      .expect(200);

    expect(
      reportFrom((studentDetail.body as { reports: unknown }).reports).contents,
    ).toHaveLength(1);

    await submitReport(app, projectId, reportId, student.accessToken);

    const teacherSubmitted = await request(app.getHttpServer())
      .get(`/projects/${projectId}/reports`)
      .set(bearer(teacher.accessToken))
      .expect(200);

    expect(reportFrom(teacherSubmitted.body)).toMatchObject({
      canViewContents: true,
      contents: [expect.objectContaining({ textContent: 'Contenido privado' })],
    });

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/reports/${reportId}/review`)
      .set(bearer(teacher.accessToken))
      .send({ decision: 'rejected', comment: 'Falta documentación' })
      .expect(201);

    const teacherRejected = await request(app.getHttpServer())
      .get(`/projects/${projectId}/reports`)
      .set(bearer(teacher.accessToken))
      .expect(200);

    expect(reportFrom(teacherRejected.body)).toMatchObject({
      canViewContents: false,
      contents: [],
    });

    const studentRejected = await request(app.getHttpServer())
      .get(`/projects/${projectId}/reports`)
      .set(bearer(student.accessToken))
      .expect(200);

    expect(reportFrom(studentRejected.body)).toMatchObject({
      canViewContents: true,
      contents: [expect.objectContaining({ textContent: 'Contenido privado' })],
    });
  });

  it('rechaza preparar o enviar entregas a proponentes y docentes', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const { proposerToken, projectId } = await createProjectWithProposer(app);
    const teacher = await userWithRole(app, UserRole.teacher);

    const reportId = await createTextReport(app, projectId, admin.accessToken);
    await assignProjectActor(
      app,
      projectId,
      admin.accessToken,
      teacher.user.id,
      ActorRole.teacher,
    );

    for (const token of [proposerToken, teacher.accessToken]) {
      await request(app.getHttpServer())
        .post(`/projects/${projectId}/reports/${reportId}/contents`)
        .set(bearer(token))
        .send({ kind: 'text', textContent: 'Intento' })
        .expect(403);

      await request(app.getHttpServer())
        .post(`/projects/${projectId}/reports/${reportId}/submit`)
        .set(bearer(token))
        .expect(403);
    }
  });

  it('rechaza entregas de un usuario ajeno al proyecto', async () => {
    const app = getApp();
    const { projectId } = await createProjectWithProposer(app);
    const { accessToken: strangerToken } = await registerUser(
      app,
      uniqueEmail('ajeno'),
    );

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/reports`)
      .set(bearer(strangerToken))
      .send({ title: 'Entrega ajena', dueDate: futureIsoDate(), type: 'text' })
      .expect(403);
  });

  it('no expone las entregas de un proyecto público a terceros', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const { projectId } = await createProjectWithProposer(app, false);
    const { accessToken: strangerToken } = await registerUser(
      app,
      uniqueEmail('ajeno'),
    );

    await transitionProjectStatus(
      app,
      projectId,
      admin.accessToken,
      ProjectStatus.approved,
    );

    await request(app.getHttpServer())
      .get(`/projects/${projectId}/reports`)
      .set(bearer(strangerToken))
      .expect(403);
  });
});
