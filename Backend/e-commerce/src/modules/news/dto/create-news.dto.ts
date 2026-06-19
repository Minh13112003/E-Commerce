import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NewsCategory } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateNewsDto {
  @ApiProperty({ example: 'BenThanh Tourist ký kết hợp tác với TCDL Thái Lan' })
  @IsString()
  @MinLength(5)
  title: string;

  @ApiPropertyOptional({ description: 'Slug URL (tự sinh nếu bỏ trống)' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 'Tóm tắt nội dung bài viết...' })
  @IsString()
  @MinLength(10)
  excerpt: string;

  @ApiProperty({ example: 'Nội dung đầy đủ bài viết...' })
  @IsString()
  @MinLength(20)
  content: string;

  @ApiPropertyOptional({ enum: NewsCategory, default: NewsCategory.COMPANY })
  @IsEnum(NewsCategory)
  @IsOptional()
  category?: NewsCategory;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
