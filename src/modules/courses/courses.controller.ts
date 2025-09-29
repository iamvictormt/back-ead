import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { Role } from '../../decorators/role.decorator';
import { UpdateCourseDto } from './dto/update-course.dto';

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
  @Role('ADMIN')
  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateCourseDto) {
    return this.coursesService.updateCourse(id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('available')
  async getAvailableCourses(@Req() req) {
    const userId = Number(req.user.userId);
    return this.coursesService.findCoursesAvailableForPurchase(userId);
  }

  @Get('active')
  async getActiveCourses(@Req() req) {
    return this.coursesService.findCoursesAvailableForPurchase(0);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-courses')
  async getMyCourses(@Req() req) {
    const userId = req.user.userId;
    return this.coursesService.findMyCourses(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Role('ADMIN')
  @Get()
  async getAllCourses() {
    return this.coursesService.findAllCourses();
  }

  @UseGuards(AuthGuard('jwt'))
  @Role('ADMIN')
  @Get(':id')
  async getCourse(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findOne(id);
  }

  @Get(':id/purchase/:userId')
  async getCourseDetailToPurchase(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number
  ) {
    if(userId !== 0) {
      await this.coursesService.getLinkCourse(userId, id);
    }
    return this.coursesService.findOne(id, true);
  }

  @UseGuards(AuthGuard('jwt'))
  @Role('ADMIN')
  @Patch(':id/deactivate')
  async deactivateCourse(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.deactivateCourse(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Role('ADMIN')
  @Patch(':id/reactivate')
  async reactivateCourse(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.reactivateCourse(id);
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

  @Post(':courseId/enroll')
  async enrollPurchase(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body('userId', ParseIntPipe) userId: number,
    @Body('pricePaid') pricePaid: number,
  ) {
    return this.coursesService.enrollStudentPurchase(
      userId,
      courseId,
      pricePaid,
    );
  }

  @Role('ADMIN')
  @Post(':courseId/gift')
  async enrollGift(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.coursesService.enrollStudentGift(userId, courseId);
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
