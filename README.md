# CapstoneHUB

Servicio diseñado para apoyar la gestión integral de proyectos que permiten a los estudiantes aplicar conocimientos académicos a situaciones del mundo real, a menudo en colaboración con empresas en entornos de ingeniería aplicada. Su propósito es facilitar la administración, seguimiento y evaluación de los proyectos de titulación, permitiendo optimizar los recursos disponibles y mejorar la coordinación entre los distintos actores involucrados.

## Descripción técnica

Monorepo con dos aplicaciones que comparten una base de datos PostgreSQL y un bucket de objetos (RustFS, S3-compatible):

| Carpeta | Qué es |
| --- | --- |
| `hub-backend/` | API REST — **NestJS 11**, **Prisma 7** (adaptador `pg`), PostgreSQL 15 y RustFS/S3. |
| `hub-frontend/` | App web — **Next.js 16** (App Router), React 19, Tailwind v4 y shadcn/ui. |

- **Backend.** Autenticación propia: contraseñas con **scrypt** y tokens **HMAC-SHA256**; `AuthGuard` global (todas las rutas exigen token salvo las marcadas `@Public()`). Los roles globales (`admin`, `directivo`, `evaluator`, `teacher`, `proposer`, `student`) se combinan con asignaciones por proyecto en `AuthorizationService`. Swagger en `/api`.
- **Frontend.** El navegador nunca llama al backend: cada `app/api/**/route.ts` actúa como **BFF** y reenvía a `BACKEND_URL`, evitando CORS. La sesión se guarda en `localStorage` y la identidad visual sigue el [sistema de diseño UTB](./docs/frontend_design_system.md).
- **Evaluación.** Rúbricas por área creadas por directivos, asignadas por proyecto y semestre, y una evaluación con nota ponderada por cada evaluador asignado. El avance de fase y el cierre exigen las evaluaciones correspondientes.
- **Archivos.** Los binarios viven en RustFS/S3; las subidas y descargas pasan por la API y los objetos huérfanos se limpian con `npm run storage:gc`.
- **Errores.** Las respuestas siguen una forma consistente (`statusCode`, `message`, `error`); la caída de la base de datos se traduce a `503` y hay una sonda `GET /health`.

El detalle de cada capa está en la [documentación](#documentación).

## Cómo ejecutar para desarollo

Requisitos: **Docker + Docker Compose** (recomendado) o Node 20+, PostgreSQL y RustFS locales. Ver [BUILD.md](./BUILD.md) para el detalle.

### Opción A, devcontainer

```bash
docker compose -f .devcontainer/docker-compose.yml up --build
```

Abre el proyecto en VS Code, ejecuta *Dev Containers: Reopen in Container* y, dentro del contenedor, instala dependencias y arranca:

```bash
cd /workspace/hub-backend  && npm ci
cd /workspace/hub-frontend && npm ci
```

### Opción B, Docker Compose (todo el stack)

```bash
cp .env.example .env
cp hub-backend/.env.example hub-backend/.env
cp hub-frontend/.env.example hub-frontend/.env

docker compose up --build
```

### Opción C, sin Docker

```bash
# Backend
cd hub-backend
npm ci
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev # http://localhost:3001  (Swagger en /api)

# Frontend
cd hub-frontend
npm ci
npm run dev # http://localhost:3000
```

Al correr el backend fuera de Docker, `hub-backend/.env` debe apuntar a `localhost` (`DATABASE_URL`, `S3_ENDPOINT`).

### Servicios y puertos

| Servicio | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend (Swagger) | http://localhost:3001/api |
| RustFS (API / consola) | http://localhost:9000 · http://localhost:9001 |
| PostgreSQL | localhost:5432 |

### Variables de entorno clave

- `hub-backend/.env`: `DATABASE_URL`, `AUTH_SECRET` (mínimo 32 caracteres), `S3_*` y, para el primer arranque, `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` / `INITIAL_ADMIN_NAME` (crean el admin inicial si la base está vacía).
- `hub-frontend/.env`: `BACKEND_URL` (por defecto `http://localhost:3001`).

### Datos de prueba

Con PostgreSQL migrado (y RustFS para los anexos):

```bash
cd hub-backend
npm run seed          # usuarios, proyectos, actores, hitos, observaciones, anexos
npm run seed:reset    # borra y vuelve a crear los datos sembrados
```

Credenciales de ejemplo (todas con contraseña `Capstone123!`): `admin.seed@capstonehub.test`, `coord.ana@capstonehub.test`, `eval.maria@capstonehub.test`, `advisor.sofia@capstonehub.test`, `student.juan@capstonehub.test`. Más detalles y flags en [BUILD.md](./BUILD.md).

## Documentación

- [BUILD.md](./BUILD.md) — setup, seeds, storage y despliegue.
- Arquitectura: [backend](./docs/backend_arch.md) · [base de datos](./docs/database_arch.md) · [frontend](./docs/frontend_arch.md)
- [Sistema de diseño del frontend](./docs/frontend_design_system.md)
- [Plan de SSO](./docs/sso-plan.md)
- [Propuesta](./docs/Propuesta.md) · [MVP](./docs/MVP.md) · [Arc42](./docs/arc42.md) · [Estructura Proyectos](./docs/Estructura_Proyectos.md)

## Estudiantes

- Jhonatan Romani Terán
- Josue Annicchiarico Correa
- Alejandro Duarte García
