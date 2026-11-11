import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { GuidesController } from './guides.controller';
import { GuidesService } from './guides.service';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [GuidesController],
  providers: [GuidesService],
})
export class GuidesModule {}
