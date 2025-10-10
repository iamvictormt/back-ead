import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, email: string, password: string, isAdmin: boolean = false) {
    const existingUser = await this.findByEmail(email);
    if (existingUser) throw new ConflictException('E-mail já cadastrado');

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: { name, email, password: hashedPassword, role: isAdmin ? 'ADMIN' : 'STUDENT' },
    });
  }

  async updateUser(userId: number, dto: UpdateUserDto) {
    if (dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email já está em uso por outro usuário');
      }
    }

    const { email, ...safeData } = dto;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...safeData,
        updatedAt: new Date(),
      },
    });
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuário não encontrado');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      throw new Error(
        'A senha atual fornecida não confere. Verifique e tente novamente.',
      );

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findMyProfile(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        profilePic: true,
        country: true,
        birthDate: true,
        city: true,
        phone: true,
        createdAt: true,
        role: true,
      },
    });
  }

  async getAllUsers(
    page: number,
    limit: number,
    search?: string
  ) {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      role: 'STUDENT',
    };

    // Se houver busca, procura em name OU email
    if (search && search.trim() !== '') {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          profilePic: true,
          role: true,
          createdAt: true,
        },
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: whereClause,
      }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllAdmins(currentUserId: number) {
    return this.prisma.user.findMany({
      where: {
        role: 'ADMIN',
        id: { not: currentUserId },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async deleteAdmin(adminId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: adminId } });

    if (!user || user.role !== 'ADMIN') {
      throw new NotFoundException('Admin não encontrado');
    }

    return this.prisma.user.delete({
      where: { id: adminId },
    });
  }

}
