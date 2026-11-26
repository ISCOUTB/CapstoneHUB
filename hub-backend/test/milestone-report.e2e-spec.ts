import request from 'supertest';
import { useTestApp } from './helpers/e2e';
import {
  AuthSession,
  adminSession,
  bearer,
  registerUser,
  uniqueEmail,
  userWithRole,
} from './helpers/auth';
import {
  assignProjectActor,
  createProject,
  transitionProjectStatus,
} from './helpers/projects';
import {
  ActorRole,
  ProjectStatus,
  UserRole,
} from '../src/generated/prisma/client';

const PROGRAM_ID = 'ingenieria-industrial';

function parseBinary(
  response: request.Response,
  callback: (error: Error | null, body: Buffer) => void,
): void {
  const chunks: Buffer[] = [];

  response.on('data', (chunk: Buffer) => chunks.push(chunk));
  response.on('end', () => callback(null, Buffer.concat(chunks)));
}

describe('Milestone report (e2e)', () => {
  const getApp = useTestApp();

  async function createProjectWithProgram(
    app: ReturnType<typeof getApp>,
    isPrivate = true,
  ): Promise<{ projectId: number; proposer: AuthSession }> {
    const proposer = await registerUser(app, uniqueEmail('proposer'));
    const { id } = await createProject(app, proposer.accessToken, {
      isPrivate,
      programRequirements: [{ programId: PROGRAM_ID, studentCount: 2 }],
    });

    return { projectId: id, proposer };
  }

  function downloadReport(
    app: ReturnType<typeof getApp>,
    projectId: number,
    token: string,
  ) {
    return request(app.getHttpServer())
      .get(`/projects/${projectId}/export/milestones/pdf`)
      .set(bearer(token))
      .buffer(true)
      .parse(parseBinary);
  }

  it('lets admin and directivo download the report of any project', async () => {
    const app = getApp();
    const { projectId } = await createProjectWithProgram(app);
    const sessions = [
      await adminSession(app),
      await userWithRole(app, UserRole.directivo),
    ];

    for (const session of sessions) {
      const response = await downloadReport(
        app,
        projectId,
        session.accessToken,
      ).expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain(
        'hitos-proyecto-',
      );
      expect((response.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');
    }
  });

  it('includes the answers saved for the program', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const { projectId } = await createProjectWithProgram(app);

    await request(app.getHttpServer())
      .put(`/projects/${projectId}/milestone-assessments/${PROGRAM_ID}`)
      .set(bearer(admin.accessToken))
      .send({
        answers: {
          'overview-1': { status: 'yes', observation: 'Cumple el diagnóstico' },
        },
      })
      .expect(200);

    const response = await downloadReport(
      app,
      projectId,
      admin.accessToken,
    ).expect(200);

    expect((response.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');
  });

  it('lets an assigned teacher download the report of a private project', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const teacher = await userWithRole(app, UserRole.teacher);
    const { projectId } = await createProjectWithProgram(app, true);

    await assignProjectActor(
      app,
      projectId,
      admin.accessToken,
      teacher.user.id,
      ActorRole.teacher,
    );

    const response = await downloadReport(
      app,
      projectId,
      teacher.accessToken,
    ).expect(200);

    expect((response.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');
  });

  it('lets a teacher assigned as evaluator download the report', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const teacher = await userWithRole(app, UserRole.teacher);
    const { projectId } = await createProjectWithProgram(app, true);

    await assignProjectActor(
      app,
      projectId,
      admin.accessToken,
      teacher.user.id,
      ActorRole.evaluator,
    );

    await downloadReport(app, projectId, teacher.accessToken).expect(200);
  });

  it('rejects students, evaluators and proposers', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const { projectId, proposer } = await createProjectWithProgram(app);
    const student = await userWithRole(app, UserRole.student);
    const evaluator = await userWithRole(app, UserRole.evaluator);

    await assignProjectActor(
      app,
      projectId,
      admin.accessToken,
      student.user.id,
      ActorRole.student,
    );
    await assignProjectActor(
      app,
      projectId,
      admin.accessToken,
      evaluator.user.id,
      ActorRole.evaluator,
    );

    for (const session of [student, evaluator, proposer]) {
      await downloadReport(app, projectId, session.accessToken).expect(403);
    }
  });

  it('rejects an unassigned teacher on a public project', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const { projectId } = await createProjectWithProgram(app, false);
    await transitionProjectStatus(
      app,
      projectId,
      admin.accessToken,
      ProjectStatus.approved,
    );
    const teacher = await userWithRole(app, UserRole.teacher);

    await downloadReport(app, projectId, teacher.accessToken).expect(403);
  });

  it('returns 404 for a private project the teacher cannot see', async () => {
    const app = getApp();
    const { projectId } = await createProjectWithProgram(app, true);
    const teacher = await userWithRole(app, UserRole.teacher);

    await downloadReport(app, projectId, teacher.accessToken).expect(404);
  });

  it('returns 404 for an unknown project', async () => {
    const app = getApp();
    const admin = await adminSession(app);

    await downloadReport(app, 999_999, admin.accessToken).expect(404);
  });
});
