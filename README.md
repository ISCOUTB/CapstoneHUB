# CapstoneHUB

Plataforma para gestionar proyectos de titulación de la Universidad Tecnológica
de Bolívar: propuestas, equipos, hitos, evaluaciones, observaciones, estados y
anexos.

## Documentación

| Documento | Contenido |
| --- | --- |
| [BUILD.md](./BUILD.md) | Instalación, migraciones, seeds, almacenamiento, pruebas y despliegue. |
| [Arquitectura del backend](./docs/backend_arch.md) | Capas, autenticación, permisos y máquina de estados. |
| [Base de datos](./docs/database_arch.md) | Esquema Prisma y modelo de datos. |
| [Arquitectura del frontend](./docs/frontend_arch.md) | Rutas, BFF, servicios y división servidor/cliente. |
| [Sistema de diseño](./docs/frontend_design_system.md) | Tokens, utilidades y convenciones visuales UTB. |
| [Despliegue](./docs/deployment.md) | CI con GitHub Actions y despliegue en Dokploy. |
| [Plan de SSO](./docs/sso-plan.md) | Autenticación corporativa. |
| [Propuesta](./docs/Propuesta.md) | Alcance y objetivos del proyecto. |
| [MVP](./docs/MVP.md) | Funcionalidad mínima y supuestos. |
| [Arc42](./docs/arc42.md) | Documento de arquitectura. |
| [Estructura de proyectos](./docs/Estructura_Proyectos.md) | Modelo funcional de proyectos. |
| [Estructura de base de datos](./docs/Estructura_DB.md) | Referencia del modelo relacional. |
| [Convenciones para agentes](./AGENTS.md) | Reglas de código y commits del repositorio. |

## Inicio rápido

Requisitos: Docker + Docker Compose (recomendado) o Node.js 20+, PostgreSQL 15
y RustFS. El detalle completo está en [BUILD.md](./BUILD.md).

### Todo el stack con Docker

```bash
cp .env.example .env
cp hub-backend/.env.example hub-backend/.env
cp hub-frontend/.env.example hub-frontend/.env
docker compose up --build
```

### Devcontainer

```bash
docker compose -f .devcontainer/docker-compose.yml up --build
```

Dentro del contenedor, instala dependencias:

```bash
cd /workspace/hub-backend && npm ci
cd /workspace/hub-frontend && npm ci
```

### Sin Docker

Backend:

```bash
cd hub-backend
npm ci
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

Frontend, en otra terminal:

```bash
cd hub-frontend
npm ci
npm run dev
```

Al correr el backend fuera de Docker, `hub-backend/.env` debe apuntar a
`localhost` (`DATABASE_URL`, `S3_ENDPOINT`).

### Servicios y atajos

| Acción | Comando / URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend y Swagger | http://localhost:3001 · http://localhost:3001/api |
| RustFS (API / consola) | http://localhost:9000 · http://localhost:9001 |
| PostgreSQL | localhost:5432 |
| Migrar esquema | `cd hub-backend && npx prisma migrate dev` |
| Sembrar datos | `cd hub-backend && npm run seed` |
| Resetear seeds | `cd hub-backend && npm run seed:reset` |
| Tests backend | `cd hub-backend && npm run lint && npm test` |
| Tests frontend | `cd hub-frontend && npm run lint && npm run build` |

Los seeds usan la contraseña `Capstone123!`; por ejemplo,
`admin.seed@capstonehub.test` o `student.juan@capstonehub.test`. Los e2e y sus
bases de datos se explican en [BUILD.md](./BUILD.md#tests).
