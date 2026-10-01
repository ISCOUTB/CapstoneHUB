import {
  ArgumentsHost,
  Catch,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '../../generated/prisma/client';

/** Códigos de Prisma que indican que no se pudo alcanzar la base de datos. */
const DATABASE_UNAVAILABLE_PRISMA_CODES = new Set([
  'P1001', // No se puede alcanzar el servidor de base de datos.
  'P1002', // El servidor de base de datos agotó el tiempo de espera.
  'P1008', // La operación agotó el tiempo de espera.
  'P1017', // El servidor cerró la conexión.
]);

/** Códigos del driver `pg` que indican problemas de conexión. */
const DATABASE_UNAVAILABLE_SYSTEM_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ECONNRESET',
  'ENOTFOUND',
  'EPIPE',
]);

/**
 * Determina si un error corresponde a una base de datos inalcanzable y no a un
 * error de negocio ni al fallo de otro servicio. La detección se limita a los
 * errores de Prisma: otros clientes (por ejemplo el SDK de S3/MinIO) también
 * lanzan `ECONNREFUSED`, y no deben reportarse como caída de la base de datos.
 */
export function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return (
      DATABASE_UNAVAILABLE_PRISMA_CODES.has(error.code) ||
      DATABASE_UNAVAILABLE_SYSTEM_CODES.has(error.code)
    );
  }

  return false;
}

/**
 * Traduce los errores de conexión a la base de datos a un `503 Service
 * Unavailable` con la forma estándar de la API. El resto de excepciones se
 * delegan al filtro por defecto de Nest, de modo que no cambia su manejo.
 */
@Catch()
export class DatabaseExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  constructor(adapterHost: HttpAdapterHost) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    if (!isDatabaseUnavailable(exception)) {
      super.catch(exception, host);
      return;
    }

    this.logger.error(
      'La base de datos no está disponible; se responde 503',
      exception instanceof Error ? exception.stack : String(exception),
    );

    super.catch(
      new ServiceUnavailableException('Database is unavailable'),
      host,
    );
  }
}
