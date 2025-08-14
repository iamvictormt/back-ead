import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe, Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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
  @Get('my-courses')
  async getMyCourses(@Req() req) {
    const userId = req.user.userId;
    return this.coursesService.findMyCourses(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-courses/:courseId')
  async getMyCourse(
    @Req() req,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    const userId = req.user.userId;
    if (!userId) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const course = await this.coursesService.getMyCourseById(userId, courseId);
    if (!course) {
      throw new NotFoundException(
        'Curso não encontrado ou não adquirido pelo usuário',
      );
    }

    return course;
  }

  @Post('enroll')
  async enrollStudent(
    @Body() body: { userId: number; courseId: number; pricePaid: number },
  ) {
    return this.coursesService.enrollStudent(
      body.userId,
      body.courseId,
      body.pricePaid,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('my-courses/:courseId/lessons/:lessonId/complete')
  async completeLesson(
    @Req() req,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    const userId = req.user.userId;
    return this.coursesService.markLessonCompleted(userId, courseId, lessonId);
  }
}
