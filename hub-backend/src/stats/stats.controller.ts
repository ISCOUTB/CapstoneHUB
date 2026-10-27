import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { SemesterStatsResponse } from './semester-stats';
import { KpiResponse, StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('kpis')
  kpis(@CurrentUser() user: AuthenticatedUser): Promise<KpiResponse> {
    return this.statsService.kpisForUser(user);
  }

  @Get('semesters')
  semesters(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SemesterStatsResponse> {
    return this.statsService.semesterStats(user);
  }
}
