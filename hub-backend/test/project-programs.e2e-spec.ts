import request from 'supertest';
import { useTestApp } from './helpers/e2e';
import {
  bearer,
  registerUser,
  uniqueEmail,
  userWithRole,
} from './helpers/auth';
import { createProject } from './helpers/projects';
import { UserRole } from '../src/generated/prisma/client';

describe('Project programs (e2e)', () => {
  const getApp = useTestApp();

  it('adds programs to an existing project and preserves assessments when removed and restored', async () => {
    const app = getApp();
    const proposer = await registerUser(app, uniqueEmail('proposer'));
    const { id: projectId } = await createProject(app, proposer.accessToken);
    const directivo = await userWithRole(app, UserRole.directivo);

    const added = await request(app.getHttpServer())
      .put(`/projects/${projectId}/programs`)
      .set(bearer(directivo.accessToken))
      .send({
        programRequirements: [
          { programId: 'ingenieria-industrial', studentCount: 2 },
        ],
      })
      .expect(200);

    expect(added.body).toEqual([
      expect.objectContaining({
        programId: 'ingenieria-industrial',
        programName: 'Ingeniería Industrial',
        studentCount: 2,
      }),
    ]);

    const listed = await request(app.getHttpServer())
      .get(`/projects/${projectId}/milestone-assessments`)
      .set(bearer(directivo.accessToken))
      .expect(200);

    expect(listed.body).toHaveLength(1);

    await request(app.getHttpServer())
      .put(`/projects/${projectId}/milestone-assessments/ingenieria-industrial`)
      .set(bearer(directivo.accessToken))
      .send({
        answers: {
          'overview-1': { status: 'yes', observation: 'Cumple' },
        },
      })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/projects/${projectId}/programs`)
      .set(bearer(directivo.accessToken))
      .send({ programRequirements: [] })
      .expect(200);

    const withoutPrograms = await request(app.getHttpServer())
      .get(`/projects/${projectId}/milestone-assessments`)
      .set(bearer(directivo.accessToken))
      .expect(200);

    expect(withoutPrograms.body).toEqual([]);

    await request(app.getHttpServer())
      .put(`/projects/${projectId}/programs`)
      .set(bearer(directivo.accessToken))
      .send({
        programRequirements: [
          { programId: 'ingenieria-industrial', studentCount: 2 },
        ],
      })
      .expect(200);

    const restored = await request(app.getHttpServer())
      .get(`/projects/${projectId}/milestone-assessments`)
      .set(bearer(directivo.accessToken))
      .expect(200);

    expect(restored.body).toEqual([
      expect.objectContaining({
        programId: 'ingenieria-industrial',
        answers: {
          'overview-1': { status: 'yes', observation: 'Cumple' },
        },
      }),
    ]);
  });

  it('rejects evaluators and students from changing project programs', async () => {
    const app = getApp();
    const proposer = await registerUser(app, uniqueEmail('proposer'));
    const { id: projectId } = await createProject(app, proposer.accessToken);
    const evaluator = await userWithRole(app, UserRole.evaluator);
    const student = await userWithRole(app, UserRole.student);

    for (const token of [evaluator.accessToken, student.accessToken]) {
      await request(app.getHttpServer())
        .put(`/projects/${projectId}/programs`)
        .set(bearer(token))
        .send({
          programRequirements: [
            { programId: 'ingenieria-industrial', studentCount: 1 },
          ],
        })
        .expect(403);
    }
  });
});
