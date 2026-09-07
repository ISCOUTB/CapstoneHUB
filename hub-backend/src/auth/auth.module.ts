import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { AuthorizationService } from './authorization.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    AuthGuard,
    AdminGuard,
    AuthorizationService,
  ],
  exports: [AuthService, AuthGuard, AdminGuard, AuthorizationService],
})
export class AuthModule {}
