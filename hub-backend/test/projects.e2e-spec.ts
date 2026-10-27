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

describe('Projects (e2e)', () => {
  const getApp = useTestApp();

  it('crea un proyecto privado, lo lista y lee su detalle', async () => {
    const app = getApp();
    const { accessToken } = await registerUser(app, uniqueEmail('owner'));
    const { id } = await createProject(app, accessToken);
    expect(id).toBeGreaterThan(0);

    const list = await request(app.getHttpServer())
      .get('/projects')
      .set(bearer(accessToken))
      .expect(200);

    expect(
      (list.body as { id: number }[]).some((project) => project.id === id),
    ).toBe(true);

    const detail = await request(app.getHttpServer())
      .get(`/projects/${id}`)
      .set(bearer(accessToken))
      .expect(200);

    expect(detail.body).toMatchObject({ id, name: 'Proyecto E2E' });
  });

  it('oculta un proyecto privado a visitantes anónimos', async () => {
    const app = getApp();
    const { accessToken } = await registerUser(app, uniqueEmail('owner'));
    const { id } = await createProject(app, accessToken);

    await request(app.getHttpServer()).get(`/projects/${id}`).expect(404);
  });

  it('permite a un directivo asignar actores sin estar asignado', async () => {
    const app = getApp();
    const { accessToken } = await registerUser(app, uniqueEmail('owner'));
    const { id } = await createProject(app, accessToken);
    const directivo = await userWithRole(app, UserRole.directivo);
    const student = await userWithRole(app, UserRole.student);

    await request(app.getHttpServer())
      .post(`/projects/${id}/actors`)
      .set(bearer(directivo.accessToken))
      .send({ userId: student.user.id, role: ActorRole.student })
      .expect(201);

    const assignable = await request(app.getHttpServer())
      .get(`/projects/${id}/assignable-users`)
      .set(bearer(directivo.accessToken))
      .expect(200);

    expect(
      (assignable.body as { id: number }[]).some(
        (candidate) => candidate.id === student.user.id,
      ),
    ).toBe(true);
  });

  it('rechaza asignar actores a un evaluador sin asignación', async () => {
    const app = getApp();
    const { accessToken } = await registerUser(app, uniqueEmail('owner'));
    const { id } = await createProject(app, accessToken);
    const evaluator = await userWithRole(app, UserRole.evaluator);
    const student = await userWithRole(app, UserRole.student);

    await request(app.getHttpServer())
      .post(`/projects/${id}/actors`)
      .set(bearer(evaluator.accessToken))
      .send({ userId: student.user.id, role: ActorRole.student })
      .expect(403);
  });

  it('publica los proyectos no privados aprobados para usuarios con sesión', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const student = await userWithRole(app, UserRole.student);
    const { projectId } = await createProjectWithProposer(app, false);

    // Mientras siga en propuesta no es público para nadie.
    await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .expect(404);

    const pendingList = await request(app.getHttpServer())
      .get('/projects')
      .set(bearer(student.accessToken))
      .expect(200);
    expect(
      (pendingList.body as { id: number }[]).some(
        (project) => project.id === projectId,
      ),
    ).toBe(false);

    await transitionProjectStatus(
      app,
      projectId,
      admin.accessToken,
      ProjectStatus.approved,
    );

    // Sin sesión solo se publican los finalizados.
    await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .expect(404);

    // Con sesión aparece en el listado y el detalle va sin datos sensibles.
    const list = await request(app.getHttpServer())
      .get('/projects')
      .set(bearer(student.accessToken))
      .expect(200);
    expect(
      (list.body as { id: number }[]).some(
        (project) => project.id === projectId,
      ),
    ).toBe(true);

    const detail = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set(bearer(student.accessToken))
      .expect(200);
    expect(detail.body).toMatchObject({
      id: projectId,
      canViewSensitiveData: false,
    });
  });

  it('filtra y ordena el listado de proyectos', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const marker = uniqueEmail('filtro').split('@')[0];
    const nameA = `${marker} Ana`;
    const nameB = `${marker} Beto`;
    const nameC = `${marker} Carla`;

    const projectA = await createProject(app, admin.accessToken, {
      name: `${marker} Alfa`,
      namep: nameA,
      source: 'internal_need',
      requiresLegalization: true,
      startDate: '2026-02-01',
      isPrivate: false,
    });
    const projectB = await createProject(app, admin.accessToken, {
      name: `${marker} Beta`,
      namep: nameB,
      source: 'research',
      researchGroup: 'Grupo de investigación E2E',
      requiresLegalization: false,
      startDate: '2025-08-01',
      isPrivate: false,
    });
    const projectC = await createProject(app, admin.accessToken, {
      name: `${marker} Gamma`,
      namep: nameC,
      source: 'external_entity',
      sourceDetails: `${marker} detalle externo`,
      nit: '900123456',
      externalAdvisorName: 'Asesor Externo E2E',
      externalAdvisorEmail: uniqueEmail('asesor'),
      requiresLegalization: false,
      isPrivate: true,
    });

    const student = await userWithRole(app, UserRole.student);
    await assignProjectActor(
      app,
      projectB.id,
      admin.accessToken,
      student.user.id,
      ActorRole.student,
    );

    await transitionProjectStatus(
      app,
      projectA.id,
      admin.accessToken,
      ProjectStatus.approved,
    );

    async function list(
      query: string,
    ): Promise<{ id: number; name: string }[]> {
      const response = await request(app.getHttpServer())
        .get(`/projects?${query}`)
        .set(bearer(admin.accessToken))
        .expect(200);

      return response.body as { id: number; name: string }[];
    }

    const search = await list(`search=${marker}`);
    expect(search.map((project) => project.id)).toEqual(
      expect.arrayContaining([projectA.id, projectB.id, projectC.id]),
    );

    const approved = await list(`search=${marker}&status=approved`);
    expect(approved.map((project) => project.id)).toEqual([projectA.id]);

    const proposed = await list(`search=${marker}&status=proposed`);
    expect(proposed.map((project) => project.id)).toEqual(
      expect.arrayContaining([projectB.id, projectC.id]),
    );

    const multiStatus = await list(
      `search=${marker}&status=approved&status=proposed`,
    );
    expect(multiStatus.map((project) => project.id)).toEqual(
      expect.arrayContaining([projectA.id, projectB.id, projectC.id]),
    );

    const byProposer = await list(
      `search=${marker}&proposer=${encodeURIComponent(nameA)}`,
    );
    expect(byProposer.map((project) => project.id)).toEqual([projectA.id]);

    const bySource = await list(`search=${marker}&source=research`);
    expect(bySource.map((project) => project.id)).toEqual([projectB.id]);

    const requiresLegalization = await list(
      `search=${marker}&requiresLegalization=true`,
    );
    expect(requiresLegalization.map((project) => project.id)).toEqual([
      projectA.id,
    ]);

    const withoutLegalization = await list(
      `search=${marker}&requiresLegalization=false`,
    );
    expect(withoutLegalization.map((project) => project.id)).toEqual(
      expect.arrayContaining([projectB.id, projectC.id]),
    );

    const year2026 = await list(`search=${marker}&year=2026`);
    expect(year2026.map((project) => project.id)).toEqual([projectA.id]);

    const withoutYear = await list(`search=${marker}&withoutYear=true`);
    expect(withoutYear.map((project) => project.id)).toEqual([projectC.id]);

    const proposedByMe = await list(`search=${marker}&proposedByMe=true`);
    expect(proposedByMe.map((project) => project.id)).toEqual(
      expect.arrayContaining([projectA.id, projectB.id, projectC.id]),
    );

    const hasTeam = await list(`search=${marker}&hasTeam=true`);
    expect(hasTeam.map((project) => project.id)).toEqual([projectB.id]);

    const privateOnly = await list(`search=${marker}&isPrivate=true`);
    expect(privateOnly.map((project) => project.id)).toEqual([projectC.id]);

    const assignedToStudent = await request(app.getHttpServer())
      .get(`/projects?search=${marker}&assignedToMe=true`)
      .set(bearer(student.accessToken))
      .expect(200);
    expect(
      (assignedToStudent.body as { id: number }[]).map((project) => project.id),
    ).toEqual([projectB.id]);

    const sorted = await list(`search=${marker}&sort=name-asc`);
    expect(sorted.map((project) => project.name)).toEqual([
      `${marker} Alfa`,
      `${marker} Beta`,
      `${marker} Gamma`,
    ]);

    await request(app.getHttpServer())
      .get('/projects?status=not-a-status')
      .set(bearer(admin.accessToken))
      .expect(400);
  });

  it('nunca publica los proyectos rechazados aunque no sean privados', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const student = await userWithRole(app, UserRole.student);
    const { projectId } = await createProjectWithProposer(app, false);

    await transitionProjectStatus(
      app,
      projectId,
      admin.accessToken,
      ProjectStatus.rejected,
    );

    await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .expect(404);

    const list = await request(app.getHttpServer())
      .get('/projects')
      .set(bearer(student.accessToken))
      .expect(200);
    expect(
      (list.body as { id: number }[]).some(
        (project) => project.id === projectId,
      ),
    ).toBe(false);
  });
});
