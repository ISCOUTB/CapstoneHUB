# Despliegue: CI/CD y Dokploy

Este documento describe cómo se integran la integración continua (GitHub
Actions) y el despliegue en un servidor con **Dokploy**.

## Flujo

1. **Pull request / push a `main`**: se ejecuta `.github/workflows/ci.yml`
   (lint, tests y build del backend; lint y build del frontend).
2. **Nuevo tag `v*`** (por ejemplo `v1.0.0`): `.github/workflows/release.yml`
   construye las imágenes Docker y las publica en **GHCR**, y luego dispara el
   webhook de Dokploy si `DOKPLOY_WEBHOOK_URL` está configurado. Los releases
   solo se publican con tags; `main` no publica imágenes.
3. **Dokploy** compila o baja las imágenes y levanta `compose.dokploy.yml`
   (`rustfs`, `backend`, `frontend`; la base de datos la gestiona Dokploy). Las
   migraciones de Prisma se aplican al arrancar el backend (`npm run db:deploy`).

Ver también [BUILD.md](../BUILD.md) para el entorno local y
[backend_arch.md](./backend_arch.md).

## Local vs producción

No hay un modo de ejecución en el código: la app se configura solo con variables
de entorno, así que "local" y "producción" son distintos valores y comandos.

| Aspecto | Local | Producción |
| --- | --- | --- |
| Cómo se ejecuta | `npm run start:dev` / `next dev` o `compose.yml` | imágenes compiladas en Dokploy vía `compose.dokploy.yml` |
| Build | ts-node watch / Next dev | `nest build` → `node dist/src/main`; Next standalone |
| `NODE_ENV` | desarrollo | `production` (imagen) |
| Base de datos | contenedor en `localhost:5432` | contenedor `db:5432` (o gestionada) |
| Migraciones | `prisma migrate dev` | `prisma migrate deploy` al arrancar |
| Seed | `npm run seed` | nunca (el seeder se bloquea si `NODE_ENV=production`) |
| Almacenamiento | RustFS en `http://localhost:9000` | RustFS interno (solo accesible desde el backend) |
| `BACKEND_URL` | `http://localhost:3001` | `http://backend:3001` |
| Swagger `/api` | habilitado | deshabilitado (`SWAGGER_ENABLED=false`) |
| TLS / dominio | no | Traefik + Let's Encrypt |

## Integración continua (CI)

`.github/workflows/ci.yml` corre en cada PR y en cada push a `main`:

- **backend** (`hub-backend`): `npm ci`, `npx prisma generate`, `npm run lint`,
  `npm test`, `npm run build`.
- **frontend** (`hub-frontend`): `npm ci`, `npm run lint`, `npm run build`.

No requiere secretos. El build del frontend no necesita el backend: las páginas
que leen datos son `force-dynamic`.

## Imágenes (GHCR)

`.github/workflows/release.yml` publica dos imágenes en GitHub Container
Registry usando `GITHUB_TOKEN` (no hace falta configurar nada):

```
ghcr.io/<owner>/capstonehub-backend:<tag>
ghcr.io/<owner>/capstonehub-frontend:<tag>
```

Tags generados al publicar un tag `vX.Y.Z`: `sha-<commit>`, `X`, `X.Y`, `X.Y.Z`
y `latest`. Para despliegues reproducibles fija una versión concreta
(`BACKEND_IMAGE` / `FRONTEND_IMAGE` en el entorno de Dokploy).

Las imágenes quedan **privadas** por defecto. Dokploy puede bajarlas si
configuras el registry (ver abajo) o puedes hacerlas públicas en
*Package settings → Change visibility*.

## Dependabot

`.github/dependabot.yml` abre PRs semanales para `github-actions`, las
dependencias npm de ambos paquetes y las imágenes base de los Dockerfiles.

## Despliegue en Dokploy

### 1. Registry de GHCR

En Dokploy → **Registry** → *Create Registry*:

| Campo | Valor |
| --- | --- |
| Name | `GHCR` |
| Username | tu usuario de GitHub |
| Password | un token con `read:packages` (o `write:packages`) |
| Registry URL | `ghcr.io` |

Prueba y guarda. Sirve para que Dokploy baje las imágenes privadas.

### 2. Proyecto y servicio Compose

1. Crea un **Project** y dentro un servicio **Compose** (tipo *Docker Compose*).
2. Provider: **GitHub** (app de Dokploy) o **Git** con la URL del repo.
3. Branch: `main`.
4. **Compose Path**: `./compose.dokploy.yml`.
5. Guarda.

### 3. Variables de entorno

Copia `.env.dokploy.example` en la pestaña **Environment** y reemplaza los
valores. Las variables se escriben en el `.env` del compose y `compose.dokploy.yml`
las referencia con `${VAR}`.

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Conexión al servicio de base de datos de Dokploy (host interno). |
| `AUTH_SECRET` | Firma de tokens (mínimo 32 caracteres, aleatoria). |
| `INITIAL_ADMIN_*` | Admin inicial si la base está vacía. |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` | Credenciales y bucket del almacenamiento RustFS. |
| `MAX_FILE_SIZE_BYTES`, `MAX_REPORT_FILE_SIZE_BYTES`, `MAX_GUIDE_FILE_SIZE_BYTES` | Límites de archivos (anexos, entregas y guías). |
| `SWAGGER_ENABLED` | `true` habilita Swagger en `/api`; está **deshabilitado por defecto**. |

> **No ejecutes el seed en producción.** El seeder se niega a correr cuando
> `NODE_ENV=production`; si de verdad lo necesitas, usa `--force`
> (`npm run seed -- --force`).

**Seguridad por defecto.** El backend aplica `helmet` (cabeceras de seguridad) y
un límite de peticiones global (300/min por IP, con 10/min para `login` y
`register`). Detrás de Traefik la IP del cliente se obtiene con `trust proxy 1`.
El BFF del frontend añade `X-Content-Type-Options: nosniff`, `X-Frame-Options:
DENY` y una verificación de `Origin` para las mutaciones (CSRF). No requieren
variables adicionales.

### 4. Dominios

En la pestaña **Domains** agrega:

| Servicio | Puerto | Ejemplo |
| --- | --- | --- |
| `frontend` | `3000` | `https://app.example.com` |

- El dominio del **frontend** es la app.
- El almacenamiento (RustFS) es **solo interno**: las subidas y descargas pasan
  por la API, así que **no necesita dominio público ni CORS**.
- Activa HTTPS (Dokploy gestiona los certificados con Let's Encrypt). Crea los
  registros `A` correspondientes.

Opcionalmente, si quieres administrar el almacenamiento, expón la consola de
RustFS (`9001`) con otro dominio protegido.

### 5. Deploy y auto deploy

- Pulsa **Deploy** para el primer despliegue.
- Para redesplegar al publicar un release, habilita **Auto Deploy** en la pestaña
  *General* del servicio. Dokploy te da un webhook; pégalo en el secreto
  `DOKPLOY_WEBHOOK_URL` del repositorio de GitHub para que `release.yml` lo
  dispare automáticamente al crear un tag `v*`.

### 6. Respaldos

Usa **Volume Backups** de Dokploy sobre `db_data` y `rustfs_data` (volúmenes
nombrados, aptos para respaldo). Si migras a S3 externo, solo respalda `db_data`.

> **Limpieza de objetos huérfanos.** Si un guardado falla entre el almacenamiento
> y la base de datos, el objeto queda sin fila; `npm run storage:gc` lo limpia
> (ver `docs/backend_arch.md`). En producción, prográmalo periódicamente
> (p. ej. un cron diario en el contenedor del backend).

## S3 real en producción

El compose incluye RustFS para simplicidad. Para usar S3 (AWS u otro compatible),
quita el servicio `rustfs` y ajusta en el backend:

```
S3_ENDPOINT=""            # vacío usa el endpoint de AWS
S3_REGION="us-east-1"
S3_BUCKET="..."
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."
S3_FORCE_PATH_STYLE="false"
```

Como las subidas pasan por la API, no hace falta configurar CORS ni un endpoint
público.

## Solución de problemas

- **`401` al bajar imágenes**: el registry de GHCR en Dokploy no está bien
  configurado o el paquete es privado sin token. Revísalo en **Registry**.
- **Subidas que fallan**: revisa que el backend alcance `S3_ENDPOINT` (el
  servicio `rustfs`) y que `S3_BUCKET` exista (el backend lo crea al arrancar).
- **La base no migra**: revisa los logs del servicio `backend`; el comando de
  arranque aplica `prisma migrate deploy`.
- **El deploy no se dispara**: `DOKPLOY_WEBHOOK_URL` no está configurado, o no
  se creó un tag `v*` (los releases no se publican desde `main`).
