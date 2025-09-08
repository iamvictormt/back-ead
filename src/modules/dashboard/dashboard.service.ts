import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { startOfMonth, endOfMonth } from 'date-fns';

type RecentActivity =
  | {
      type: 'lesson_completed';
      courseId: number;
      lessonId: number;
      lessonTitle: string;
    }
  | { type: 'certificate_earned'; courseId: number; certificateId: number };

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStudent(userId: number) {
    // Buscar purchases do usuário
    const purchases = await this.prisma.purchase.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: { include: { lessons: true } },
            certificates: { where: { userId } },
          },
        },
      },
    });

    // Buscar progressos do usuário
    const progresses = await this.prisma.progress.findMany({
      where: { userId },
    });

    // Criar mapa de courseId -> progress
    const progressMap = new Map<
      number,
      { completedLessonIds: number[]; totalLessons: number }
    >();
    progresses.forEach((p) => {
      progressMap.set(p.courseId, {
        completedLessonIds: p.completedLessonIds,
        totalLessons: p.totalLessons,
      });
    });

    // Mapear os cursos
    const courses = purchases.map((purchase) => {
      const course = purchase.course;
      const progress = progressMap.get(course.id) || {
        completedLessonIds: [],
        totalLessons: 0,
      };

      const allLessons = course.modules.flatMap((m) => m.lessons);
      const completedLessons = allLessons.filter((l) =>
        progress.completedLessonIds.includes(l.id),
      ).length;
      const totalLessons = allLessons.length;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        instructor: course.instructor,
        category: course.category,
        price: course.price,
        pricePaid: purchase.pricePaid,
        purchaseDate: purchase.createdAt.toISOString().split('T')[0],
        status:
          completedLessons === totalLessons ? 'Concluído' : 'Em Progresso',
        progress: {
          completedLessons,
          totalLessons,
          percentage:
            totalLessons === 0
              ? 0
              : Math.round((completedLessons / totalLessons) * 100),
        },
        modules: course.modules.map((m) => ({
          id: m.id,
          title: m.title,
          order: m.order,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            videoUrl: l.videoUrl,
            pdfUrl: l.pdfUrl,
            order: l.order,
            completed: progress.completedLessonIds.includes(l.id),
          })),
        })),
        certificate:
          course.certificates.length > 0
            ? {
                id: course.certificates[0].id,
                issuedAt: course.certificates[0].issuedAt.toISOString(),
              }
            : null,
        rating: course.rating,
        studentsCount: course.studentsCount,
      };
    });

    // Estatísticas agregadas
    const stats = {
      activeCourses: courses.filter((c) => c.status === 'Em Progresso').length,
      completedCourses: courses.filter((c) => c.status === 'Concluído').length,
      studyHours: 0, // opcional: somar duração dos vídeos se tiver
      certificates: courses.filter((c) => c.certificate).length,
      totalProgress: courses.length
        ? Math.round(
            courses.reduce((sum, c) => sum + c.progress.percentage, 0) /
              courses.length,
          )
        : 0,
    };

    // Atividades recentes
    const recentActivity: RecentActivity[] = [];
    for (const course of courses) {
      for (const module of course.modules) {
        for (const lesson of module.lessons) {
          if (lesson.completed) {
            recentActivity.push({
              type: 'lesson_completed',
              courseId: course.id,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
            });
          }
        }
      }
      if (course.certificate) {
        recentActivity.push({
          type: 'certificate_earned',
          courseId: course.id,
          certificateId: course.certificate.id,
        });
      }
    }

    return { stats, courses, recentActivity };
  }

  async getDashboardAdmin() {
    // Últimos 5 usuários cadastrados
    const recentUsers = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        name: true,
        email: true,
        profilePic: true,
        createdAt: true,
      },
      where: { role: 'STUDENT' },
    });

    // Total de alunos
    const totalStudents = await this.prisma.user.count({
      where: { role: 'STUDENT' },
    });

    // Cursos ativos (não desativados)
    const activeCourses = await this.prisma.course.count({
      where: { deactivatedIn: null },
    });

    // Receita do mês atual
    const now = new Date();
    const firstDay = startOfMonth(now);
    const lastDay = endOfMonth(now);

    const monthlyRevenueAggregate = await this.prisma.purchase.aggregate({
      _sum: { pricePaid: true },
      where: {
        status: 'PAID',
        createdAt: { gte: firstDay, lte: lastDay },
      },
    });

    const monthlyRevenue = monthlyRevenueAggregate._sum.pricePaid || 0;

    // Total de compras
    const totalPurchases = await this.prisma.purchase.count();

    // Cursos mais vendidos
    const topCourses = await this.prisma.purchase.groupBy({
      by: ['courseId'],
      _count: { courseId: true },
      orderBy: { _count: { courseId: 'desc' } },
      take: 5,
    });

    const topCoursesWithTitle = await Promise.all(
      topCourses.map(async (t) => {
        const course = await this.prisma.course.findUnique({
          where: { id: t.courseId },
          select: { title: true },
        });
        return { ...t, title: course?.title };
      }),
    );

    return {
      recentUsers,
      totalStudents,
      activeCourses,
      monthlyRevenue,
      totalPurchases,
      topCourses: topCoursesWithTitle,
    };
  }

}
