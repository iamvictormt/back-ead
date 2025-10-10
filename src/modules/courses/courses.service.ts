import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { randomBytes } from 'crypto';
import { UpdateCourseDto } from './dto/update-course.dto';

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

  async updateCourse(id: number, dto: UpdateCourseDto) {
    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        thumbnailUrl: dto.thumbnailUrl,
        instructor: dto.instructor,
        category: dto.category,
        rating: dto.rating ?? 0,
        studentsCount: dto.studentsCount ?? 0,
        previewVideoUrl: dto.previewVideoUrl,

        modules: {
          deleteMany: {
            courseId: id,
            id: { notIn: dto.modules.filter((m) => m.id).map((m) => m.id) },
          },
          upsert: dto.modules.map((m) => ({
            where: { id: m.id ?? 0 },
            update: {
              title: m.title,
              order: m.order,
              lessons: {
                deleteMany: {
                  moduleId: m.id ?? 0,
                  id: { notIn: m.lessons.filter((l) => l.id).map((l) => l.id) },
                },
                upsert: m.lessons.map((l) => ({
                  where: { id: l.id ?? 0 },
                  update: {
                    title: l.title,
                    videoUrl: l.videoUrl,
                    pdfUrl: l.pdfUrl,
                    order: l.order,
                  },
                  create: {
                    title: l.title,
                    videoUrl: l.videoUrl,
                    pdfUrl: l.pdfUrl,
                    order: l.order,
                  },
                })),
              },
            },
            create: {
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

    // 🔹 Atualiza o totalLessons de todos os progress do curso
    const totalLessons = updatedCourse.modules.reduce(
      (acc, mod) => acc + mod.lessons.length,
      0,
    );

    await this.prisma.progress.updateMany({
      where: { courseId: id },
      data: { totalLessons },
    });

    return updatedCourse;
  }

  async findMyCourses(userId: number, page = 1, limit = 10) {
    const total = await this.prisma.purchase.count({ where: { userId } });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const purchases = await this.prisma.purchase.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: 'asc' }, // <-- ordena módulos
              include: {
                lessons: {
                  orderBy: { order: 'asc' }, // <-- ordena aulas
                },
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
              orderBy: { order: 'asc' }, // <-- ordena módulos
              include: {
                lessons: {
                  orderBy: { order: 'asc' }, // <-- ordena aulas
                },
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
            issuedAt: certificate.issuedAt.toISOString(),
          }
        : null,
      rating: course.rating,
      studentsCount: course.studentsCount,
    };
  }

  async markLessonCompleted(
    userId: number,
    courseId: number,
    lessonId: number,
  ) {
    const existingCertificate = await this.prisma.certificate.findFirst({
      where: { userId, courseId },
    });

    if (existingCertificate) {
      throw new ConflictException('O curso já foi concluído!');
    }

    const progress = await this.prisma.progress.findFirst({
      where: { userId, courseId },
    });

    if (!progress) {
      throw new NotFoundException('Progresso do curso não encontrado');
    }

    let updatedLessonIds: number[];

    if (progress.completedLessonIds?.includes(lessonId)) {
      // Já estava concluída → remover
      updatedLessonIds = progress.completedLessonIds.filter(
        (id) => id !== lessonId,
      );
    } else {
      // Não estava concluída → adicionar
      updatedLessonIds = [...(progress.completedLessonIds || []), lessonId];
    }

    // Atualiza o progresso
    const updatedProgress = await this.prisma.progress.update({
      where: { id: progress.id },
      data: {
        completedLessonIds: updatedLessonIds,
      },
    });

    // Se todas as aulas estiverem concluídas, cria o certificado
    if (
      updatedProgress.completedLessonIds.length === updatedProgress.totalLessons
    ) {
      // Verifica se já existe certificado para evitar duplicidade

      if (!existingCertificate) {
        const token = randomBytes(16).toString('hex');

        const certificate = await this.prisma.certificate.create({
          data: {
            userId,
            courseId,
            token,
          },
        });
        return { progress: updatedProgress, certificate };
      }
    }

    return { progress: updatedProgress };
  }

  async findCoursesAvailableForPurchase(
    userId: number,
    params?: {
      search?: string;
      category?: string;
      priceRange?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { search, category, priceRange, page = 1, limit = 10 } = params || {};

    // Busca os cursos já comprados pelo usuário
    const purchasedCourses =
      userId == 0
        ? []
        : await this.prisma.purchase.findMany({
            where: { userId, status: 'PAID' },
            select: { courseId: true },
          });

    const purchasedCourseIds = purchasedCourses.map((pc) => pc.courseId);

    // Filtro de preço
    let priceFilter: any = {};
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      priceFilter = {
        gte: isNaN(min) ? undefined : min,
        lte: isNaN(max) ? undefined : max,
      };
    }

    // Condições dinâmicas
    const where: any = {
      id: { notIn: purchasedCourseIds.length > 0 ? purchasedCourseIds : [0] },
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
      ...(category && { category }),
      ...(priceRange && { price: priceFilter }),
      deactivatedIn: null,
    };

    // Paginação
    const skip = (page - 1) * limit;
    const take = limit;

    // Busca principal
    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      courses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findCoursesNotPurchasedByUser(userId: number) {
    // 1️⃣ Buscar todos os cursos comprados por esse usuário
    const purchases = await this.prisma.purchase.findMany({
      where: { userId },
      select: { courseId: true },
    });

    const purchasedIds = purchases.map((p) => p.courseId);

    // 2️⃣ Buscar cursos que NÃO estão nessa lista
    const availableCourses = await this.prisma.course.findMany({
      where: {
        deactivatedIn: null,
        id: {
          notIn: purchasedIds.length > 0 ? purchasedIds : [0], // evita erro se estiver vazio
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        thumbnailUrl: true,
        instructor: true,
        category: true,
        rating: true,
        studentsCount: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return availableCourses;
  }

  // Método interno para criar progresso
  public async createProgress(userId: number, course: any) {
    const totalLessons = course.modules.reduce(
      (sum, module) => sum + module.lessons.length,
      0,
    );

    return this.prisma.progress.create({
      data: {
        userId,
        courseId: course.id,
        completedLessonIds: [],
        totalLessons,
      },
    });
  }

  // Verifica se o usuário já está matriculado
  private async checkAlreadyEnrolled(userId: number, courseId: number) {
    const existing = await this.prisma.purchase.findFirst({
      where: { userId, courseId },
    });

    if (existing) {
      throw new ConflictException('Usuário já está matriculado neste curso');
    }
  }

  async enrollStudentPurchase(
    userId: number,
    courseId: number,
    pricePaid: number,
  ) {
    await this.checkAlreadyEnrolled(userId, courseId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { include: { lessons: true } } },
    });
    if (!course) throw new Error('Curso não encontrado');

    if (pricePaid === 0 && course.price > 0) {
      throw new Error('O curso não é gratuito');
    }
    if (pricePaid > 0 && course.price !== pricePaid) {
      throw new Error('O valor pago não corresponde ao preço do curso');
    }

    const purchase = await this.prisma.purchase.create({
      data: { userId, courseId, pricePaid, status: 'PAID' },
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        studentsCount: { increment: 1 },
      },
    });

    await this.createProgress(userId, course);
    return purchase;
  }

  async enrollStudentGift(userId: number, courseId: number) {
    await this.checkAlreadyEnrolled(userId, courseId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { include: { lessons: true } } },
    });
    if (!course) throw new Error('Curso não encontrado');

    const purchase = await this.prisma.purchase.create({
      data: { userId, courseId, pricePaid: 0, status: 'PAID' },
    });

    await this.createProgress(userId, course);
    return purchase;
  }

  async getLinkCourse(userId, courseId: number) {
    const existing = await this.prisma.purchase.findFirst({
      where: { userId, courseId },
    });

    if (existing) {
      throw new ConflictException('Usuário já está matriculado neste curso');
    }
  }

  async findAllCourses() {
    return this.prisma.course.findMany({
      include: {
        modules: {
          include: { lessons: true },
        },
      },
      orderBy: {
        createdAt: 'desc', // opcional, ordena do mais recente
      },
    });
  }

  async findOne(id: number, toPurchase: boolean = false) {
    const course = await this.prisma.course.findUnique({
      where: {
        id,
        ...(toPurchase ? { deactivatedIn: { equals: null } } : {}),
      },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!course) return null;

    // Função para "criptografar" o título com asteriscos
    const encryptTitle = () => '***********';

    return {
      ...course,
      modules: course.modules.map(({ courseId, ...mod }, moduleIndex) => ({
        ...mod,
        lessons: mod.lessons.map(({ moduleId, ...lesson }, lessonIndex) => {
          const { videoUrl, ...rest } = lesson;

          if (toPurchase && course.price > 0) {
            // Para os 2 primeiros módulos e 2 primeiras lessons
            if (moduleIndex < 2 && lessonIndex < 2) {
              return { ...rest, title: encryptTitle() };
            }

            // Para o resto, apenas "***"
            return { ...rest, title: '***' };
          }

          return toPurchase ? rest : lesson;
        }),
        // Também aplica a criptografia ao título do módulo
        ...(toPurchase && course.price > 0
          ? moduleIndex < 2
            ? { title: encryptTitle() }
            : { title: '***' }
          : {}),
      })),
      deactivatedIn: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };
  }

  async deactivateCourse(id: number) {
    return this.prisma.course.update({
      where: { id },
      data: { deactivatedIn: new Date() },
    });
  }

  async reactivateCourse(id: number) {
    return this.prisma.course.update({
      where: { id },
      data: { deactivatedIn: null },
    });
  }
}
