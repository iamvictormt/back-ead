import {
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateModuleDto } from '../../modules/dto/create-module.dto';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsUrl(undefined, { message: 'O campo URL da Imagem de Capa deve ser uma URL válida' })
  thumbnailUrl?: string;

  @IsOptional()
  @IsUrl(undefined, { message: 'O campo Link da Preview do Video deve ser uma URL válida' })
  previewVideoUrl?: string;

  @IsString()
  instructor: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  studentsCount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModuleDto)
  modules: CreateModuleDto[];
}
