import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca una ruta como accesible públicamente. El AuthGuard global sigue
 * intentando resolver el token Bearer cuando está presente, para que los
 * handlers puedan aplicar reglas de visibilidad según el espectador, pero las
 * peticiones anónimas pasan sin problema.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
