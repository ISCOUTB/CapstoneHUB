import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bearer, registerUser, uniqueEmail } from './auth';
import { ActorRole, ProjectStatus } from '../../src/generated/prisma/client';

/** Crea un proyecto privado como el usuario indicado y devuelve su id. */
export async function createProject(
  app: INestApplication<App>,
  accessToken: string,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const response = await request(app.getHttpServer())
    .post('/projects')
    .set(bearer(accessToken))
    .send({
      name: 'Proyecto E2E',
      description: 'Descripción del proyecto',
      context: 'Contexto del proyecto',
      namep: 'Proponente E2E',
      correo: uniqueEmail('proponente'),
      isPrivate: true,
      submissionConsentAt: new Date().toISOString(),
      ...overrides,
      source: overrides.source ?? 'internal_need',
    })
    .expect((res) => {
      if (res.status !== 201) {
        console.error('Error al crear proyecto:', res.status, res.body);
        throw new Error(
          `Expected 201, received ${res.status}: ${JSON.stringify(res.body)}`,
        );
      }
    });
  return response.body as { id: number };
}

/** Crea un proyecto con un proponente nuevo y devuelve su token y el id. */
export async function createProjectWithProposer(
  app: INestApplication<App>,
  isPrivate = true,
): Promise<{ projectId: number; proposerToken: string }> {
  const { accessToken: proposerToken } = await registerUser(
    app,
    uniqueEmail('prop'),
  );
  const { id: projectId } = await createProject(app, proposerToken, {
    isPrivate,
  });

  return { projectId, proposerToken };
}

/** Cambia el estado del proyecto con el token indicado. */
export async function transitionProjectStatus(
  app: INestApplication<App>,
  projectId: number,
  token: string,
  status: ProjectStatus,
): Promise<void> {
  await request(app.getHttpServer())
    .patch(`/projects/${projectId}/status`)
    .set(bearer(token))
    .send({ status })
    .expect(200);
}

/** Asigna un actor al proyecto con el token indicado y devuelve su id. */
export async function assignProjectActor(
  app: INestApplication<App>,
  projectId: number,
  token: string,
  userId: number,
  role: ActorRole,
): Promise<number> {
  const response = await request(app.getHttpServer())
    .post(`/projects/${projectId}/actors`)
    .set(bearer(token))
    .send({ userId, role })
    .expect(201);

  return (response.body as { id: number }).id;
}

/** Fecha ISO en el futuro, para `dueDate` de hitos y entregas. */
export function futureIsoDate(days = 30): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}
