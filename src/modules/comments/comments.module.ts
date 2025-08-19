import { Module } from '@nestjs/common';
import { CommentController } from './comments.controller';
import { CommentService } from './comments.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [CommentController],
  providers: [CommentService, PrismaService],
})
export class CommentModule {}
