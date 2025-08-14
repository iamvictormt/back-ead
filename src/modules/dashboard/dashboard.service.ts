import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(userId: number) {
    const totalCourses = await this.prisma.course.count();

    const progresses = await this.prisma.progress.findMany({
      where: { userId },
      select: { completedLessonIds: true, totalLessons: true },
    });

    const completedCoursesCount = progresses.filter(
      (p) => p.completedLessonIds.length >= p.totalLessons,
    ).length;

    const totalHours = progresses.reduce((sum, p) => sum + p.totalLessons, 0);

    const certificates = await this.prisma.certificate.count({
      where: { userId },
    });

    return {
      totalCourses,
      completedCourses: completedCoursesCount,
      totalHours,
      certificates,
    };
  }
}
