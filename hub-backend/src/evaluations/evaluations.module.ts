import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RubricsModule } from '../rubrics/rubrics.module';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';

@Module({
  imports: [AuthModule, RubricsModule],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
