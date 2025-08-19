import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Req } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentService } from './comments.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() dto: CreateCommentDto, @Req() req) {
    const userId = req.user.userId;
    return this.commentService.create(dto, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('lesson/:lessonId')
  findAllByLesson(@Param('lessonId') lessonId: string) {
    return this.commentService.findAllByLesson(Number(lessonId));
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommentDto) {
    return this.commentService.update(Number(id), dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentService.remove(Number(id));
  }
}
