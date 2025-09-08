import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { Role } from '../../decorators/role.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get("/student")
  async getDashboardData(@Req() req) {
    const userId = req.user.userId;
    return this.dashboardService.getDashboardStudent(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Role('ADMIN')
  @Get('/admin')
  async getDashboardAdmin() {
    return this.dashboardService.getDashboardAdmin();
  }

}
