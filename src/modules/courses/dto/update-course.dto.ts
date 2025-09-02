import { CreateCourseDto } from './create-course.dto';
import { IsNumber } from 'class-validator';

export class UpdateCourseDto extends CreateCourseDto {
  @IsNumber()
  id: number;
}
