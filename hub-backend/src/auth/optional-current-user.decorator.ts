import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from './auth.types';

/**
 * Lee al espectador en rutas que permiten acceso anónimo. Devuelve `undefined`
 * cuando la petición no trae un usuario autenticado.
 */
export const OptionalCurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
