import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bearer } from './auth';
import { futureIsoDate } from './projects';

/** Crea una entrega de tipo texto y devuelve su id. */
export async function createTextReport(
  app: INestApplication<App>,
  projectId: number,
  token: string,
  title = 'Informe',
): Promise<number> {
  const created = await request(app.getHttpServer())
    .post(`/projects/${projectId}/reports`)
    .set(bearer(token))
    .send({ title, dueDate: futureIsoDate(), type: 'text' })
    .expect(201);

  return (created.body as { id: number }).id;
}

export async function addReportTextContent(
  app: INestApplication<App>,
  projectId: number,
  reportId: number,
  token: string,
  textContent: string,
): Promise<void> {
  await request(app.getHttpServer())
    .post(`/projects/${projectId}/reports/${reportId}/contents`)
    .set(bearer(token))
    .send({ kind: 'text', textContent })
    .expect(201);
}

export async function submitReport(
  app: INestApplication<App>,
  projectId: number,
  reportId: number,
  token: string,
): Promise<void> {
  await request(app.getHttpServer())
    .post(`/projects/${projectId}/reports/${reportId}/submit`)
    .set(bearer(token))
    .expect(201);
}
