import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateTravelTipDto {
  @ApiProperty({ example: 'Kinh nghiệm du lịch Nhật Bản tự túc 2026' })
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty({ example: 'Bí kíp không thể bỏ qua khi du lịch Nhật Bản...' })
  @IsString()
  @MinLength(10)
  excerpt: string;

  @ApiProperty({ example: 'Nội dung chi tiết mẹo du lịch...' })
  @IsString()
  @MinLength(20)
  content: string;

  @ApiProperty({ example: 'Nhật Bản', description: 'Điểm đến (phải khớp với tourCity để liên kết tour)' })
  @IsString()
  destination: string;

  @ApiPropertyOptional({ type: [String], example: ['visa', 'giao thông', 'tiết kiệm'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: 'Nhật Bản', description: 'Query tìm kiếm tour liên quan' })
  @IsString()
  @IsOptional()
  relatedSearchQuery?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
