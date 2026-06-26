import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTourTypeDto {
  @ApiPropertyOptional({
    description: 'Cấp 1: Loại hình tour. Ví dụ: "Trong nước", "Quốc tế"',
    example: 'Trong nước',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Cấp 2: Khu vực/Châu lục. Ví dụ: "Miền Bắc", "Miền Trung", "Miền Nam", "Châu Âu", "Đông Nam Á"',
    example: 'Miền Bắc',
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    description: 'Cấp 3: Thành phố/Quốc gia cụ thể. Ví dụ: "Hà Nội", "Đà Nẵng", "Pháp", "Thái Lan"',
    example: 'Hà Nội',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo loại tour cụ thể. Ví dụ: "TOUR HÈ", "TOUR CAO CẤP"',
    example: 'TOUR HÈ',
  })
  @IsString()
  @IsOptional()
  tourType?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}

export class QueryTopToursDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}
