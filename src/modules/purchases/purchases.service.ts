import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService,
              private cursesService: CoursesService) {}

  async createFakePayment(userId: number, courseId: number) {
    // Verifica se o curso e o usuário existem
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Curso não encontrado');

    // Cria a compra como "paga"
    const purchase = await this.prisma.purchase.create({
      data: {
        userId,
        courseId,
        pricePaid: course.price,
        status: PaymentStatus.PAID,
        paymentId: randomUUID(),
      },
      include: {
        course: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Incrementa o contador de alunos do curso
    await this.prisma.course.update({
      where: { id: courseId },
      data: { studentsCount: { increment: 1 } },
    });

    await this.cursesService.createProgress(userId, course);

    return {
      message: 'Compra confirmada com sucesso!',
      purchase,
    };
  }
}
