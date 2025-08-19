import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCommentDto, userId: number) {
    // Se tiver parentId, precisamos validar o nível
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { id: true, parentId: true },
      });

      if (!parent) {
        throw new Error('Comentário pai não encontrado');
      }

      // Se o pai já tiver um parentId, significa que ele já é nível 1 ou 2
      if (parent.parentId) {
        const grandParent = await this.prisma.comment.findUnique({
          where: { id: parent.parentId },
          select: { id: true, parentId: true },
        });

        // Se o pai também já tem um pai, estamos tentando criar nível 3
        if (grandParent?.parentId) {
          throw new Error(
            'Profundidade máxima de comentários atingida (2 níveis)',
          );
        }
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        userId,
        lessonId: dto.lessonId,
        parentId: dto.parentId,
      },
    });

    return this.prisma.comment.findUnique({
      where: { id: comment.id },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
        replies: {
          include: {
            user: { select: { id: true, name: true, role: true } },
            replies: {
              include: {
                user: { select: { id: true, name: true, role: true } },
              },
            },
          },
        },
      },
    });
  }

  async findAllByLesson(lessonId: number) {
    return this.prisma.comment.findMany({
      where: { lessonId, parentId: null },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
        replies: {
          include: {
            user: { select: { id: true, name: true, role: true } },
            replies: {
              include: {
                user: { select: { id: true, name: true, role: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: number, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comentário não encontrado');

    return this.prisma.comment.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comentário não encontrado');

    return this.prisma.comment.delete({ where: { id } });
  }
}
