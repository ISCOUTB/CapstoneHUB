FROM node:26-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       git \
       openssl \
       postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace