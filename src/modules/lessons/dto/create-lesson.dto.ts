import { IsString, IsOptional, IsUrl, IsInt } from 'class-validator';

export class CreateLessonDto {
  @IsInt()
  @IsOptional()
  id: number;

  @IsString()
  title: string;

  @IsUrl(undefined, { message: 'O campo URL do vídeo deve ser uma URL válida' })
  videoUrl: string;

  @IsOptional()
  @IsUrl(undefined, { message: 'O campo URL do PDF deve ser uma URL válida' })
  pdfUrl?: string;

  @IsInt()
  order: number;
}
