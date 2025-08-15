import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get("/student")
  async getDashboardData(@Req() req) {
    const userId = req.user.userId;
    return this.dashboardService.getDashboardStudent(userId);
  }
}
