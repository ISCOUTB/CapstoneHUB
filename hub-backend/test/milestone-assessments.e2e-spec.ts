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

describe('Milestone assessments (e2e)', () => {
  const getApp = useTestApp();

  async function createProjectWithProgram(
    app: ReturnType<typeof getApp>,
    programId: string,
  ): Promise<number> {
    const proposer = await registerUser(app, uniqueEmail('proposer'));
    const { id } = await createProject(app, proposer.accessToken, {
      programRequirements: [{ programId, studentCount: 1 }],
    });

    return id;
  }

  it('lets a directivo evaluate any project without assignment', async () => {
    const app = getApp();
    const projectId = await createProjectWithProgram(
      app,
      'ingenieria-industrial',
    );
    const directivo = await userWithRole(app, UserRole.directivo);

    const listed = await request(app.getHttpServer())
      .get(`/projects/${projectId}/milestone-assessments`)
      .set(bearer(directivo.accessToken))
      .expect(200);

    type AssessmentBody = {
      programId: string;
      programName: string;
      summary: { totalItems: number; answeredItems: number };
      template: { programId: string } | null;
    };
    const assessments = listed.body as AssessmentBody[];
    expect(assessments).toHaveLength(1);
    expect(assessments[0]).toMatchObject({
      programId: 'ingenieria-industrial',
      programName: 'Ingeniería Industrial',
      summary: { totalItems: 37, answeredItems: 0 },
    });
    expect(assessments[0].template?.programId).toBe('ingenieria-industrial');

    const saved = await request(app.getHttpServer())
      .put(`/projects/${projectId}/milestone-assessments/ingenieria-industrial`)
      .set(bearer(directivo.accessToken))
      .send({
        answers: {
          'overview-1': { status: 'yes', observation: 'Cumple' },
        },
      })
      .expect(200);

    expect(saved.body).toMatchObject({
      programId: 'ingenieria-industrial',
      summary: { totalItems: 37, answeredItems: 1, yes: 1 },
    });
  });

  it('returns programs without a template as unsupported', async () => {
    const app = getApp();
    const projectId = await createProjectWithProgram(app, 'ingenieria-civil');
    const directivo = await userWithRole(app, UserRole.directivo);

    const listed = await request(app.getHttpServer())
      .get(`/projects/${projectId}/milestone-assessments`)
      .set(bearer(directivo.accessToken))
      .expect(200);

    expect(listed.body).toEqual([
      expect.objectContaining({
        programId: 'ingenieria-civil',
        template: null,
      }),
    ]);
  });

  it('rejects answers for unknown assessment items', async () => {
    const app = getApp();
    const projectId = await createProjectWithProgram(
      app,
      'ingenieria-industrial',
    );
    const directivo = await userWithRole(app, UserRole.directivo);

    await request(app.getHttpServer())
      .put(`/projects/${projectId}/milestone-assessments/ingenieria-industrial`)
      .set(bearer(directivo.accessToken))
      .send({
        answers: {
          'unknown-item': { status: 'yes', observation: '' },
        },
      })
      .expect(400);
  });
});
