import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Módulo global: una única instancia de `PrismaService` (y de su pool de
 * conexiones) para toda la aplicación, sin volver a declararlo en cada módulo.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
