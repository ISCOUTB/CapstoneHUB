# Con Devcontainers

La manera recomendada de trabajar en el proyecto es por medio de devcontainers:

```bash
docker compose -f .devcontainer/docker-compose.yml up --build
```

Si se utiliza VS Code, el workflow es:

- abrir el proyecto en VS Code
- instalar la extensión **Dev Containers**
- ejecutar el comando "Dev Containers: Reopen in Container"
- luego las terminales de VS Code serán en el contenedor

Luego instalar las dependencias dentro del contenedor:

```bash
cd /workspace/hub-backend && npm ci
cd /workspace/hub-frontend && npm ci
```

Postgresql se ejecuta automáticamente

# ejecutar backend y generar esquemas de prisma orm

```bash
npx prisma generate
npx prisma migrate dev --name [name]
npm start dev
```

ir a [https://localhost:3001/api](https://localhost:3001/api)

# ejecutar el frontend

```bash
npm run dev
```

ir a [http://localhost:3000](http://localhost:3000)
