import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryProductDTO {
    @ApiPropertyOptional({
        description: 'Filter products by category name',
        example: 'Electronics',
    })
    @IsString()
    @IsOptional()
    categoryName?: string;

    @ApiPropertyOptional({
        description: 'Filter products by active status',
        example: true,
    })
    @Transform(({ value }) => {
        if(value === 'true' || value === true) return true;
        if(value === 'false' || value === false) return false;
        return undefined;
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Search products by name',
        example: 'Smartphone',
    })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiProperty({
        description: 'Page number (starting from 1)',
        example: 1,
        required: false,
      })
      @IsOptional()
      @Type(() => Number)
      @IsInt()
      @Min(1)
      page: number = 1;
    
      @ApiProperty({
        description: 'Number of items per page',
        example: 10,
        required: false,
      })
      @IsOptional()
      @Type(() => Number)
      @IsInt()
      @Min(1)
      @Max(100) // Giới hạn tối đa 100 items/trang
      limit: number = 36;
}