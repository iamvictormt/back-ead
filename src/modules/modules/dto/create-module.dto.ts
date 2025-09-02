import { IsString, IsArray, ValidateNested, IsInt, IsOptional } from 'class-validator';
import { CreateLessonDto } from '../../lessons/dto/create-lesson.dto';
import { Type } from 'class-transformer';

export class CreateModuleDto {
  @IsInt()
  @IsOptional()
  id: number;

  @IsString()
  title: string;

  @IsInt()
  order: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonDto)
  lessons: CreateLessonDto[];
}
