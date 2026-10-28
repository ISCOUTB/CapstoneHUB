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
  createProject,
  createProjectWithProposer,
  transitionProjectStatus,
} from './helpers/projects';
import { ProjectStatus, UserRole } from '../src/generated/prisma/client';

describe('Observations (e2e)', () => {
  const getApp = useTestApp();

  it('un directivo sin asignación agrega y lista observaciones', async () => {
    const app = getApp();
    const { accessToken: proposerToken } = await registerUser(
      app,
      uniqueEmail('prop'),
    );
    const directivo = await userWithRole(app, UserRole.directivo);
    const { id: projectId } = await createProject(app, proposerToken);

    const created = await request(app.getHttpServer())
      .post(`/projects/${projectId}/observations`)
      .set(bearer(directivo.accessToken))
      .send({ content: 'Observación de prueba' })
      .expect(201);

    expect((created.body as { content: string }).content).toBe(
      'Observación de prueba',
    );
    expect((created.body as { author: { id: number } }).author.id).toBe(
      directivo.user.id,
    );

    const list = await request(app.getHttpServer())
      .get(`/projects/${projectId}/observations`)
      .set(bearer(proposerToken))
      .expect(200);

    expect(
      (list.body as { id: number }[]).some(
        (observation) => observation.id === (created.body as { id: number }).id,
      ),
    ).toBe(true);
  });

  it('rechaza observar a un evaluador sin asignación', async () => {
    const app = getApp();
    const { accessToken } = await registerUser(app, uniqueEmail('prop'));
    const evaluator = await userWithRole(app, UserRole.evaluator);
    const { id: projectId } = await createProject(app, accessToken);

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/observations`)
      .set(bearer(evaluator.accessToken))
      .send({ content: 'Intento sin asignación' })
      .expect(403);
  });

  it('un admin sin asignación también puede observar', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const { accessToken } = await registerUser(app, uniqueEmail('prop'));
    const { id: projectId } = await createProject(app, accessToken);

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/observations`)
      .set(bearer(admin.accessToken))
      .send({ content: 'Revisión administrativa' })
      .expect(201);
  });

  it('rechaza a un usuario ajeno listar las observaciones', async () => {
    const app = getApp();
    const { accessToken } = await registerUser(app, uniqueEmail('prop'));
    const { id: projectId } = await createProject(app, accessToken);

    const { accessToken: strangerToken } = await registerUser(
      app,
      uniqueEmail('ajeno'),
    );

    await request(app.getHttpServer())
      .get(`/projects/${projectId}/observations`)
      .set(bearer(strangerToken))
      .expect(403);
  });

  it('rechaza a un usuario ajeno agregar observaciones', async () => {
    const app = getApp();
    const { accessToken } = await registerUser(app, uniqueEmail('prop'));
    const { id: projectId } = await createProject(app, accessToken);

    const { accessToken: strangerToken } = await registerUser(
      app,
      uniqueEmail('ajeno'),
    );

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/observations`)
      .set(bearer(strangerToken))
      .send({ content: 'No debería poder observar' })
      .expect(403);
  });

  it('no expone las observaciones de un proyecto público a terceros', async () => {
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

    // El detalle es público para usuarios con sesión, pero las secciones
    // sensibles siguen reservadas a los miembros.
    await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set(bearer(strangerToken))
      .expect(200);

    await request(app.getHttpServer())
      .get(`/projects/${projectId}/observations`)
      .set(bearer(strangerToken))
      .expect(403);
  });
});
