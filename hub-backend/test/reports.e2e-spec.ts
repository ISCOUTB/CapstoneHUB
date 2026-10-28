import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
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
  createProjectWithProposer,
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

  /** Crea una entrega de tipo texto y devuelve su id. */
  async function createReport(
    app: INestApplication<App>,
    projectId: number,
    token: string,
  ): Promise<number> {
    const created = await request(app.getHttpServer())
      .post(`/projects/${projectId}/reports`)
      .set(bearer(token))
      .send({ title: 'Informe final', dueDate: futureIsoDate(), type: 'text' })
      .expect(201);

    return (created.body as { id: number }).id;
  }

  it('un directivo gestiona y revisa entregas y un estudiante asignado las envía', async () => {
    const app = getApp();
    const directivo = await userWithRole(app, UserRole.directivo);
    const student = await userWithRole(app, UserRole.student);
    const { projectId } = await createProjectWithProposer(app);

    // El directivo crea la entrega y asigna al estudiante sin estar asignado al
    // proyecto.
    const reportId = await createReport(app, projectId, directivo.accessToken);
    await assignProjectActor(
      app,
      projectId,
      directivo.accessToken,
      student.user.id,
      ActorRole.student,
    );

    // El estudiante asignado prepara el contenido y envía la entrega.
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/reports/${reportId}/contents`)
      .set(bearer(student.accessToken))
      .send({ kind: 'text', textContent: 'Contenido de prueba' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/reports/${reportId}/submit`)
      .set(bearer(student.accessToken))
      .expect(201);

    // El directivo la revisa sin asignación.
    const reviewed = await request(app.getHttpServer())
      .post(`/projects/${projectId}/reports/${reportId}/review`)
      .set(bearer(directivo.accessToken))
      .send({ decision: 'accepted', comment: 'Cumple con lo solicitado' })
      .expect(201);

    expect(reviewed.body).toMatchObject({ id: reportId, status: 'accepted' });
  });

  it('rechaza preparar o enviar entregas a proponentes y docentes', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const { proposerToken, projectId } = await createProjectWithProposer(app);
    const teacher = await userWithRole(app, UserRole.teacher);

    const reportId = await createReport(app, projectId, admin.accessToken);
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
