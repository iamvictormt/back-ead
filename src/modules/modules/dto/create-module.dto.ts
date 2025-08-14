import { IsString, IsArray, ValidateNested, IsInt } from 'class-validator';
import { CreateLessonDto } from '../../lessons/dto/create-lesson.dto';
import { Type } from 'class-transformer';

export class CreateModuleDto {
  @IsString()
  title: string;

  @IsInt()
  order: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonDto)
  lessons: CreateLessonDto[];
}
