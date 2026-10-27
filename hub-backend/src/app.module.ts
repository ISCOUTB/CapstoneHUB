import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectsModule } from './projects/projects.module';
import { PrismaModule } from './prisma.module';
import { ObservationsModule } from './observations/observations.module';
import { MilestonesModule } from './milestones/milestones.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { ReportsModule } from './reports/reports.module';
import { StatsModule } from './stats/stats.module';
import { AuthModule } from './auth/auth.module';
import { RubricsModule } from './rubrics/rubrics.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { HealthModule } from './health/health.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    ProjectsModule,
    ObservationsModule,
    MilestonesModule,
    AttachmentsModule,
    ReportsModule,
    StatsModule,
    AuthModule,
    RubricsModule,
    EvaluationsModule,
    HealthModule,
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }],
      // Permite desactivar el límite global (p. ej. en tests e2e).
      skipIf: () => process.env.DISABLE_THROTTLE === 'true',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Convierte los errores de conexión a la base de datos en un 503 estable.
    { provide: APP_FILTER, useClass: DatabaseExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      // `{*splat}` cubre todas las rutas, incluida la raíz `/`.
      .forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
  }
}
