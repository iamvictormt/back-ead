import { IsString, IsOptional, IsUrl, IsInt } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsUrl()
  videoUrl: string;

  @IsOptional()
  @IsUrl()
  pdfUrl?: string;

  @IsInt()
  order: number;
}
