import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async createCourse(dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        thumbnailUrl: dto.thumbnailUrl,
        modules: {
          create:
            dto.modules?.map((module) => ({
              title: module.title,
              order: module.order,
              lessons: {
                create:
                  module.lessons?.map((lesson) => ({
                    title: lesson.title,
                    videoUrl: lesson.videoUrl,
                    pdfUrl: lesson.pdfUrl,
                    order: lesson.order,
                  })) || [],
              },
            })) || [],
        },
      },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });
  }

  async findMyCourses(userId: number) {
    const purchases = await this.prisma.purchase.findMany({
      where: {
        userId,
        status: 'PAID',
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    });

    return purchases.map(purchase => purchase.course);
  }

  async findCoursesAvailableForPurchase(userId: number) {
    const purchasedCourses = await this.prisma.purchase.findMany({
      where: { userId, status: 'PAID' },
      select: { courseId: true },
    });
    const purchasedCourseIds = purchasedCourses.map(
      (pc: { courseId: any }) => pc.courseId,
    );

    return this.prisma.course.findMany({
      where: {
        id: {
          notIn: purchasedCourseIds.length > 0 ? purchasedCourseIds : [0],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
