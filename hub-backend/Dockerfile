# reference source: https://docs.nestjs.com/deployment

FROM node:26-slim

# install libssl for prisma to work fine
RUN apt-get update -y \
&& apt-get install -y openssl


WORKDIR /usr/src/app

COPY ./package.json ./
COPY ./package-lock.json ./

RUN if [ -f package-lock.json ]; then \
    npm ci --no-audit --no-fund; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["sh", "-c",  "npm run db:deploy && node dist/src/main"]
