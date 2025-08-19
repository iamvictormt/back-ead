import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsInt()
  lessonId: number;

  @IsOptional()
  @IsInt()
  parentId?: number;
}
