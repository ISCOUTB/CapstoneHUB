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
  ActorRole,
  ProjectStatus,
  UserRole,
} from '../src/generated/prisma/client';
import {
  createProject,
  submitCurrentPhaseEvaluation,
} from './helpers/projects';
import { PrismaService } from '../src/prisma.service';

describe('Projects workflow (e2e)', () => {
  const getApp = useTestApp();

  it('recorre los estados y avanza de fase tras las aprobaciones', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const { accessToken: proposerToken } = await registerUser(
      app,
      uniqueEmail('propietario'),
    );

    const { id: projectId } = await createProject(app, proposerToken);

    // El admin impulsa el ciclo de forma secuencial (cada transición depende
    // de la anterior): proposed -> approved -> in_progress.
    const toApproved = await request(app.getHttpServer())
      .patch(`/projects/${projectId}/status`)
      .set(bearer(admin.accessToken))
      .send({ status: 'approved' })
      .expect(200);
    expect((toApproved.body as { status: string }).status).toBe('approved');

    const toInProgress = await request(app.getHttpServer())
      .patch(`/projects/${projectId}/status`)
      .set(bearer(admin.accessToken))
      .send({ status: 'in_progress' })
      .expect(200);
    expect((toInProgress.body as { status: string }).status).toBe(
      'in_progress',
    );

    // Evaluador de expo, asignado al proyecto.
    const evaluator = await userWithRole(app, UserRole.evaluator);
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/actors`)
      .set(bearer(admin.accessToken))
      .send({ userId: evaluator.user.id, role: ActorRole.evaluator })
      .expect(201);

    // Sin aprobaciones no se puede avanzar.
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/phase/advance`)
      .set(bearer(admin.accessToken))
      .expect(409);

    // Proponente y evaluador dan el visto bueno.
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/phase/approvals`)
      .set(bearer(proposerToken))
      .expect(201);
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/phase/approvals`)
      .set(bearer(evaluator.accessToken))
      .expect(201);

    // La evaluación de la fase es obligatoria antes de avanzar.
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/phase/advance`)
      .set(bearer(admin.accessToken))
      .expect(409);

    await submitCurrentPhaseEvaluation(app, projectId, evaluator.accessToken);

    // Ahora sí avanza a semester_2.
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/phase/advance`)
      .set(bearer(admin.accessToken))
      .expect(201);

    const detail = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set(bearer(proposerToken))
      .expect(200);

    expect((detail.body as { phase: string }).phase).toBe('semester_2');
  });

  it('un directivo aprueba la propuesta sin estar asignado', async () => {
    const app = getApp();
    const { accessToken: proposerToken } = await registerUser(
      app,
      uniqueEmail('propietario'),
    );
    const directivo = await userWithRole(app, UserRole.directivo);
    const { id: projectId } = await createProject(app, proposerToken);

    const approved = await request(app.getHttpServer())
      .patch(`/projects/${projectId}/status`)
      .set(bearer(directivo.accessToken))
      .send({ status: 'approved', description: 'Propuesta viable' })
      .expect(200);

    expect((approved.body as { status: string }).status).toBe('approved');
  });

  it('deja salir a los proyectos legados que quedaron en under_review', async () => {
    const app = getApp();
    const prisma = app.get(PrismaService);
    const { accessToken: proposerToken } = await registerUser(
      app,
      uniqueEmail('propietario'),
    );
    const directivo = await userWithRole(app, UserRole.directivo);
    const { id: projectId } = await createProject(app, proposerToken);

    // Los datos antiguos conservan el estado legado; se fuerza aquí porque la
    // API ya no permite entrar a `under_review`.
    await prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.under_review },
    });

    const approved = await request(app.getHttpServer())
      .patch(`/projects/${projectId}/status`)
      .set(bearer(directivo.accessToken))
      .send({ status: 'approved', description: 'Revisión de proyecto legado' })
      .expect(200);

    expect((approved.body as { status: string }).status).toBe('approved');
  });

  it('un evaluador sin asignación no puede resolver la propuesta', async () => {
    const app = getApp();
    const { accessToken: proposerToken } = await registerUser(
      app,
      uniqueEmail('propietario'),
    );
    const evaluator = await userWithRole(app, UserRole.evaluator);
    const { id: projectId } = await createProject(app, proposerToken);

    await request(app.getHttpServer())
      .patch(`/projects/${projectId}/status`)
      .set(bearer(evaluator.accessToken))
      .send({ status: 'approved', description: 'Intento sin asignación' })
      .expect(403);
  });

  it('ya no permite entrar al estado under_review', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const { accessToken: proposerToken } = await registerUser(
      app,
      uniqueEmail('propietario'),
    );
    const { id: projectId } = await createProject(app, proposerToken);

    await request(app.getHttpServer())
      .patch(`/projects/${projectId}/status`)
      .set(bearer(admin.accessToken))
      .send({ status: 'under_review' })
      .expect(400);
  });

  it('rechaza cambiar el estado a un usuario no autorizado', async () => {
    const app = getApp();
    const { accessToken: proposerToken } = await registerUser(
      app,
      uniqueEmail('propietario'),
    );
    const { id: projectId } = await createProject(app, proposerToken);

    // Un proponente no puede aprobar su propia propuesta (esa transición es de
    // evaluador/admin).
    await request(app.getHttpServer())
      .patch(`/projects/${projectId}/status`)
      .set(bearer(proposerToken))
      .send({ status: 'approved' })
      .expect(403);
  });
});
