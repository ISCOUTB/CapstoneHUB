import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ObservationsController } from './observations.controller';
import { ObservationsService } from './observations.service';

@Module({
  controllers: [ObservationsController],
  providers: [ObservationsService, PrismaService],
})
export class ObservationsModule {}