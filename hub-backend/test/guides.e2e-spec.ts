import request from 'supertest';
import { useTestApp } from './helpers/e2e';
import { adminSession, bearer, userWithRole } from './helpers/auth';
import { GuideCategory, UserRole } from '../src/generated/prisma/client';

type GuideDocumentBody = {
  id: number;
  title: string;
  category: string;
  audiences: string[];
  externalUrl: string | null;
  isPublished: boolean;
  hasFile: boolean;
};

function uniqueTitle(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe('Guides (e2e)', () => {
  const getApp = useTestApp();

  it('publica documentos, oculta borradores y restringe la administración', async () => {
    const app = getApp();
    const admin = await adminSession(app);
    const teacher = await userWithRole(app, UserRole.teacher);
    const title = uniqueTitle('Formato publicado');
    const draftTitle = uniqueTitle('Borrador');

    const published = await request(app.getHttpServer())
      .post('/guides/documents')
      .set(bearer(admin.accessToken))
      .send({
        title,
        description: 'Documento de prueba',
        category: GuideCategory.format,
        audiences: [UserRole.student, UserRole.student],
        externalUrl: 'https://example.com/formato',
      })
      .expect(201);

    const publishedBody = published.body as GuideDocumentBody;
    expect(publishedBody.audiences).toEqual([UserRole.student]);
    expect(publishedBody.hasFile).toBe(false);

    const draft = await request(app.getHttpServer())
      .post('/guides/documents')
      .set(bearer(admin.accessToken))
      .send({
        title: draftTitle,
        category: GuideCategory.guide,
        isPublished: false,
      })
      .expect(201);

    const draftBody = draft.body as GuideDocumentBody;

    const publicList = await request(app.getHttpServer())
      .get('/guides/documents')
      .expect(200);
    const publicIds = (publicList.body as GuideDocumentBody[]).map(
      (document) => document.id,
    );

    expect(publicIds).toContain(publishedBody.id);
    expect(publicIds).not.toContain(draftBody.id);

    await request(app.getHttpServer())
      .get(`/guides/documents/${publishedBody.id}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/guides/documents/${draftBody.id}`)
      .expect(404);

    await request(app.getHttpServer())
      .get('/guides/admin/documents')
      .set(bearer(teacher.accessToken))
      .expect(403);

    await request(app.getHttpServer())
      .post('/guides/documents')
      .set(bearer(teacher.accessToken))
      .send({ title: uniqueTitle('No permitido'), category: 'guide' })
      .expect(403);

    const adminList = await request(app.getHttpServer())
      .get('/guides/admin/documents')
      .set(bearer(admin.accessToken))
      .expect(200);
    const adminIds = (adminList.body as GuideDocumentBody[]).map(
      (document) => document.id,
    );

    expect(adminIds).toContain(publishedBody.id);
    expect(adminIds).toContain(draftBody.id);

    await request(app.getHttpServer())
      .get(`/guides/admin/documents/${draftBody.id}`)
      .set(bearer(admin.accessToken))
      .expect(200);
  });

  it('un directivo actualiza y elimina un documento', async () => {
    const app = getApp();
    const directivo = await userWithRole(app, UserRole.directivo);
    const title = uniqueTitle('Documento editable');

    const created = await request(app.getHttpServer())
      .post('/guides/documents')
      .set(bearer(directivo.accessToken))
      .send({
        title,
        category: GuideCategory.template,
        audiences: [UserRole.teacher],
      })
      .expect(201);

    const { id } = created.body as GuideDocumentBody;

    const updated = await request(app.getHttpServer())
      .patch(`/guides/documents/${id}`)
      .set(bearer(directivo.accessToken))
      .send({
        title: `${title} actualizado`,
        category: GuideCategory.guide,
        audiences: [],
        isPublished: false,
      })
      .expect(200);

    expect(updated.body).toMatchObject({
      id,
      category: GuideCategory.guide,
      audiences: [],
      isPublished: false,
    });

    await request(app.getHttpServer())
      .delete(`/guides/documents/${id}`)
      .set(bearer(directivo.accessToken))
      .expect(204);

    await request(app.getHttpServer())
      .get(`/guides/documents/${id}`)
      .expect(404);
  });

  it('rechaza enlaces externos inválidos y la descarga sin archivo', async () => {
    const app = getApp();
    const admin = await adminSession(app);

    await request(app.getHttpServer())
      .post('/guides/documents')
      .set(bearer(admin.accessToken))
      .send({
        title: uniqueTitle('Enlace inválido'),
        category: GuideCategory.guide,
        externalUrl: 'javascript:alert(1)',
      })
      .expect(400);

    const created = await request(app.getHttpServer())
      .post('/guides/documents')
      .set(bearer(admin.accessToken))
      .send({
        title: uniqueTitle('Sin archivo'),
        category: GuideCategory.guide,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(
        `/guides/documents/${(created.body as GuideDocumentBody).id}/download`,
      )
      .expect(404);
  });

  it('no permite descargar borradores de forma anónima', async () => {
    const app = getApp();
    const admin = await adminSession(app);

    const created = await request(app.getHttpServer())
      .post('/guides/documents')
      .set(bearer(admin.accessToken))
      .send({
        title: uniqueTitle('Borrador descargable'),
        category: GuideCategory.guide,
        isPublished: false,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(
        `/guides/documents/${(created.body as GuideDocumentBody).id}/download`,
      )
      .expect(404);
  });
});
