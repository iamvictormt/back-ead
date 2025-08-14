import { Injectable, NotFoundException } from '@nestjs/common';
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
        instructor: dto.instructor,
        category: dto.category,
        rating: dto.rating ?? 0,
        studentsCount: dto.studentsCount ?? 0,
        modules: {
          create: dto.modules.map((m) => ({
            title: m.title,
            order: m.order,
            lessons: {
              create: m.lessons.map((l) => ({
                title: l.title,
                videoUrl: l.videoUrl,
                pdfUrl: l.pdfUrl,
                order: l.order,
              })),
            },
          })),
        },
      },
      include: {
        modules: {
          include: { lessons: true },
        },
      },
    });
  }

  async findMyCourses(userId: number, page = 1, limit = 10) {
    // Contagem total de compras
    const total = await this.prisma.purchase.count({ where: { userId } });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Busca com paginação
    const purchases = await this.prisma.purchase.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
            progresses: true,
            certificates: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const courses = purchases.map((purchase) => {
      const course = purchase.course;

      const progress = course.progresses.find((p) => p.userId === userId);
      const completedLessons = progress?.completedLessonIds.length ?? 0;
      const totalLessons = progress?.totalLessons ?? 0;
      const percentage =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      const certificate =
        course.certificates.find((c) => c.userId === userId) ?? null;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl ?? '',
        instructor: course.instructor,
        price: course.price,
        pricePaid: purchase.pricePaid,
        purchaseDate: purchase.createdAt.toISOString().split('T')[0],
        status: percentage === 100 ? 'Concluído' : 'Em Progresso',
        category: course.category,
        progress: {
          completedLessons,
          totalLessons,
          percentage,
        },
        modules: course.modules.map((module) => ({
          id: module.id,
          title: module.title,
          order: module.order,
          lessons: module.lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            videoUrl: lesson.videoUrl,
            pdfUrl: lesson.pdfUrl,
            order: lesson.order,
            completed:
              progress !== undefined && completedLessons >= lesson.order,
          })),
        })),
        certificate: certificate
          ? {
              id: certificate.id,
              url: certificate.url,
              issuedAt: certificate.issuedAt.toISOString(),
            }
          : null,
        rating: course.rating,
        studentsCount: course.studentsCount,
      };
    });

    return {
      courses,
      total,
      page,
      totalPages,
    };
  }

  async getMyCourseById(userId: number, courseId: number) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { userId, courseId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
            progresses: true,
            certificates: true,
          },
        },
      },
    });

    if (!purchase) {
      return null; // ou lançar NotFoundException se quiser
    }

    const course = purchase.course;
    const progress = course.progresses.find((p) => p.userId === userId);
    const completedLessons = progress?.completedLessonIds.length ?? 0;
    const totalLessons = progress?.totalLessons ?? 0;
    const percentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const certificate = course.certificates.find((c) => c.userId === userId) ?? null;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl ?? '',
      instructor: course.instructor,
      price: course.price,
      pricePaid: purchase.pricePaid,
      purchaseDate: purchase.createdAt.toISOString().split('T')[0],
      status: percentage === 100 ? 'Concluído' : 'Em Progresso',
      categoria: course.category,
      progress: {
        completedLessons,
        totalLessons,
        percentage,
      },
      modules: course.modules.map((module) => ({
        id: module.id,
        title: module.title,
        order: module.order,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          videoUrl: lesson.videoUrl,
          pdfUrl: lesson.pdfUrl,
          order: lesson.order,
          completed: progress?.completedLessonIds?.includes(lesson.id) ?? false,
        })),
      })),
      certificate: certificate
        ? {
          id: certificate.id,
          url: certificate.url,
          issuedAt: certificate.issuedAt.toISOString(),
        }
        : null,
      rating: course.rating,
      studentsCount: course.studentsCount,
    };
  }

  async markLessonCompleted(userId: number, courseId: number, lessonId: number) {
    const progress = await this.prisma.progress.findFirst({
      where: { userId, courseId },
    });

    if (!progress) {
      throw new NotFoundException('Progresso do curso não encontrado');
    }

    let updatedLessonIds: number[];

    if (progress.completedLessonIds?.includes(lessonId)) {
      // Já estava concluída → remover
      updatedLessonIds = progress.completedLessonIds.filter(id => id !== lessonId);
    } else {
      // Não estava concluída → adicionar
      updatedLessonIds = [...(progress.completedLessonIds || []), lessonId];
    }
    
    return this.prisma.progress.update({
      where: { id: progress.id },
      data: {
        completedLessonIds: updatedLessonIds,
      },
    });
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

  async enrollStudent(userId: number, courseId: number, pricePaid: number) {
    // Cria a compra
    const purchase = await this.prisma.purchase.create({
      data: {
        userId,
        courseId,
        pricePaid,
        status: 'PAID', // ou PENDING se quiser confirmar pagamento
      },
    });

    // Cria registro de progresso inicial
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { include: { lessons: true } } },
    });

    if (!course) return;

    const totalLessons = course.modules.reduce(
      (sum, module) => sum + module.lessons.length,
      0,
    );

    await this.prisma.progress.create({
      data: {
        userId,
        courseId,
        completedLessonIds: [],
        totalLessons,
      },
    });

    return purchase;
  }
}
