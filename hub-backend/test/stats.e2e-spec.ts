import request from 'supertest';
import { useTestApp } from './helpers/e2e';
import { adminSession, bearer, userWithRole } from './helpers/auth';
import {
  assignProjectActor,
  createProjectWithProposer,
  futureIsoDate,
} from './helpers/projects';
import {
  ActorRole,
  ProjectStatus,
  UserRole,
} from '../src/generated/prisma/client';

describe('Stats (e2e)', () => {
  const getApp = useTestApp();

  it('rechaza el panel a usuarios sin rol autorizado', async () => {
    const app = getApp();
    const student = await userWithRole(app, UserRole.student);

    await request(app.getHttpServer())
      .get('/stats/kpis')
      .set(bearer(student.accessToken))
      .expect(403);
  });

  it('limita los indicadores del docente a sus proyectos asignados o propuestos', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const teacher = await userWithRole(app, UserRole.teacher);
    const { projectId: assignedId } = await createProjectWithProposer(app);
    await assignProjectActor(
      app,
      assignedId,
      admin.accessToken,
      teacher.user.id,
      ActorRole.teacher,
    );

    // Proyecto ajeno: ni asignado ni propuesto por el docente.
    await createProjectWithProposer(app);

    const response = await request(app.getHttpServer())
      .get('/stats/kpis')
      .set(bearer(teacher.accessToken))
      .expect(200);

    const body = response.body as {
      scope: string;
      projects: {
        total: number;
        byStatus: { status: string; count: number }[];
      };
    };
    expect(body.scope).toBe('assigned');
    expect(body.projects.total).toBe(1);
    expect(body.projects.byStatus).toEqual([
      { status: ProjectStatus.proposed, count: 1 },
    ]);
  });

  it('limita los indicadores del evaluador a sus proyectos asignados', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const evaluator = await userWithRole(app, UserRole.evaluator);
    const { projectId } = await createProjectWithProposer(app);
    await assignProjectActor(
      app,
      projectId,
      admin.accessToken,
      evaluator.user.id,
      ActorRole.evaluator,
    );

    // Proyecto ajeno: ni asignado ni propuesto por el evaluador.
    await createProjectWithProposer(app);

    const response = await request(app.getHttpServer())
      .get('/stats/kpis')
      .set(bearer(evaluator.accessToken))
      .expect(200);

    const body = response.body as {
      scope: string;
      projects: { total: number };
    };
    expect(body.scope).toBe('assigned');
    expect(body.projects.total).toBe(1);
  });

  it('da alcance global a directivos y administradores', async () => {
    const app = getApp();
    const directivo = await userWithRole(app, UserRole.directivo);
    await createProjectWithProposer(app);

    const response = await request(app.getHttpServer())
      .get('/stats/kpis')
      .set(bearer(directivo.accessToken))
      .expect(200);

    const body = response.body as {
      scope: string;
      projects: { total: number };
    };
    expect(body.scope).toBe('global');
    expect(body.projects.total).toBeGreaterThanOrEqual(1);
  });

  it('cuenta las entregas pendientes de revisión de sus proyectos', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const teacher = await userWithRole(app, UserRole.teacher);
    const student = await userWithRole(app, UserRole.student);
    const { projectId } = await createProjectWithProposer(app);
    await assignProjectActor(
      app,
      projectId,
      admin.accessToken,
      teacher.user.id,
      ActorRole.teacher,
    );
    await assignProjectActor(
      app,
      projectId,
      admin.accessToken,
      student.user.id,
      ActorRole.student,
    );

    const created = await request(app.getHttpServer())
      .post(`/projects/${projectId}/reports`)
      .set(bearer(admin.accessToken))
      .send({ title: 'Informe', dueDate: futureIsoDate(), type: 'text' })
      .expect(201);
    const reportId = (created.body as { id: number }).id;

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/reports/${reportId}/contents`)
      .set(bearer(student.accessToken))
      .send({ kind: 'text', textContent: 'Contenido' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/reports/${reportId}/submit`)
      .set(bearer(student.accessToken))
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/stats/kpis')
      .set(bearer(teacher.accessToken))
      .expect(200);

    const body = response.body as {
      pendingReviews: { count: number; items: { reportId: number }[] };
    };
    expect(body.pendingReviews.count).toBe(1);
    expect(body.pendingReviews.items[0]).toMatchObject({
      projectId,
      reportId,
    });
  });
});
