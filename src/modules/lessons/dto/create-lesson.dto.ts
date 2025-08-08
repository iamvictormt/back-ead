import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsString()
  videoUrl: string;

  @IsOptional()
  @IsString()
  pdfUrl?: string;

  @IsNumber()
  order: number;
}
