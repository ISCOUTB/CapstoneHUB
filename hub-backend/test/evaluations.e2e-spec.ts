import request from 'supertest';
import { useTestApp } from './helpers/e2e';
import { adminSession, bearer, userWithRole } from './helpers/auth';
import {
  assignProjectActor,
  createProjectWithProposer,
} from './helpers/projects';
import { PrismaService } from '../src/prisma.service';
import {
  ActorRole,
  ProjectPhase,
  ProjectStatus,
  UserRole,
} from '../src/generated/prisma/client';

describe('Evaluations (e2e)', () => {
  const getApp = useTestApp();

  it('permite a un directivo crear y asignar rúbricas y al evaluador calificar', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const directivo = await userWithRole(app, UserRole.directivo);
    const evaluator = await userWithRole(app, UserRole.evaluator);
    const teacher = await userWithRole(app, UserRole.teacher);
    const { projectId } = await createProjectWithProposer(app);

    await request(app.getHttpServer())
      .patch(`/projects/${projectId}/status`)
      .set(bearer(admin.accessToken))
      .send({ status: 'approved' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/projects/${projectId}/status`)
      .set(bearer(admin.accessToken))
      .send({ status: 'in_progress' })
      .expect(200);

    await assignProjectActor(
      app,
      projectId,
      admin.accessToken,
      evaluator.user.id,
      ActorRole.evaluator,
    );

    const templateResponse = await request(app.getHttpServer())
      .post('/rubrics/templates')
      .set(bearer(directivo.accessToken))
      .send({
        name: 'Rúbrica de Ingeniería',
        area: 'Ingeniería',
        criteria: [
          { title: 'Alcance', weightPercent: 60 },
          { title: 'Documentación', weightPercent: 40 },
        ],
      })
      .expect(201);

    const template = templateResponse.body as {
      id: number;
      criteria: { id: number }[];
    };

    await request(app.getHttpServer())
      .post('/rubrics/templates')
      .set(bearer(teacher.accessToken))
      .send({
        name: 'No permitida',
        criteria: [{ title: 'Único', weightPercent: 100 }],
      })
      .expect(403);

    await request(app.getHttpServer())
      .put(`/projects/${projectId}/rubric-assignments/semester_1`)
      .set(bearer(directivo.accessToken))
      .send({ rubricTemplateId: template.id })
      .expect(200);

    const evaluations = await request(app.getHttpServer())
      .get(`/projects/${projectId}/evaluations`)
      .set(bearer(evaluator.accessToken))
      .expect(200);

    const phase = (
      evaluations.body as {
        phases: {
          phase: string;
          isCurrent: boolean;
          rubric: { id: number; criteria: { id: number }[] };
        }[];
      }
    ).phases.find((item) => item.isCurrent);

    expect(phase?.rubric.id).toBe(template.id);

    await request(app.getHttpServer())
      .put(`/projects/${projectId}/evaluations/semester_1`)
      .set(bearer(evaluator.accessToken))
      .send({
        criteria: template.criteria.map((criterion, index) => ({
          criterionId: criterion.id,
          score: index === 0 ? 4 : 5,
          comment: index === 0 ? 'Buen alcance' : undefined,
        })),
        generalComment: 'Evaluación de prueba',
      })
      .expect(200);

    const detail = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set(bearer(evaluator.accessToken))
      .expect(200);

    expect(
      (detail.body as { evaluationGate: { completed: boolean } }).evaluationGate
        .completed,
    ).toBe(true);

    await request(app.getHttpServer())
      .put(`/projects/${projectId}/evaluations/semester_1`)
      .set(bearer(directivo.accessToken))
      .send({
        criteria: template.criteria.map((criterion) => ({
          criterionId: criterion.id,
          score: 5,
        })),
      })
      .expect(403);

    await request(app.getHttpServer())
      .put(`/projects/${projectId}/rubric-assignments/semester_1`)
      .set(bearer(directivo.accessToken))
      .send({ rubricTemplateId: template.id })
      .expect(409);
  });

  it('un evaluador sin asignación no accede a la evaluación', async () => {
    const app = getApp();
    const evaluator = await userWithRole(app, UserRole.evaluator);
    const { projectId } = await createProjectWithProposer(app);

    await request(app.getHttpServer())
      .get(`/projects/${projectId}/evaluations`)
      .set(bearer(evaluator.accessToken))
      .expect(403);
  });

  it('exige evaluación del segundo semestre antes de cerrar', async () => {
    const app = getApp();
    const prisma = app.get(PrismaService);
    const admin = await adminSession(app);
    const { projectId } = await createProjectWithProposer(app);

    await request(app.getHttpServer())
      .patch(`/projects/${projectId}/status`)
      .set(bearer(admin.accessToken))
      .send({ status: 'approved' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/projects/${projectId}/status`)
      .set(bearer(admin.accessToken))
      .send({ status: 'in_progress' })
      .expect(200);

    await prisma.project.update({
      where: { id: projectId },
      data: { phase: ProjectPhase.semester_2 },
    });
    await prisma.projectMilestones.updateMany({
      where: { projectId },
      data: { completed: true },
    });

    await request(app.getHttpServer())
      .patch(`/projects/${projectId}/status`)
      .set(bearer(admin.accessToken))
      .send({ status: ProjectStatus.closed })
      .expect(409);

    const evaluations = await request(app.getHttpServer())
      .get(`/projects/${projectId}/evaluations`)
      .set(bearer(admin.accessToken))
      .expect(200);

    const phase = (
      evaluations.body as {
        phases: {
          phase: string;
          isCurrent: boolean;
          rubric: { criteria: { id: number }[] };
        }[];
      }
    ).phases.find((item) => item.isCurrent);

    await request(app.getHttpServer())
      .put(`/projects/${projectId}/evaluations/semester_2`)
      .set(bearer(admin.accessToken))
      .send({
        criteria: phase!.rubric.criteria.map((criterion) => ({
          criterionId: criterion.id,
          score: 5,
        })),
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/projects/${projectId}/status`)
      .set(bearer(admin.accessToken))
      .send({ status: ProjectStatus.closed })
      .expect(200);
  });
});
