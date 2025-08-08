import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { Role } from '../../decorators/role.decorator';

@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Role('ADMIN')
  @Post()
  async create(@Body() dto: CreateCourseDto) {
    return this.coursesService.createCourse(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('available')
  async getAvailableCourses(@Req() req) {
    const userId = req.user.userId;
    return this.coursesService.findCoursesAvailableForPurchase(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  async getMyCourses(@Req() req) {
    const userId = req.user.userId;
    return this.coursesService.findMyCourses(userId);
  }
}
