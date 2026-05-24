import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export enum OrderStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
}

export class QueryOrderDTO {
    @ApiPropertyOptional({
        description: 'Search orders by id or order number',
        example: '1234567890',
        required: false,
    })
    @Transform(({ value }) => value?.trim())
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter orders by status',
        example: OrderStatus.PENDING,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    status?: OrderStatus;


    @ApiProperty({
        description: 'Page number (starting from 1)',
        example: '1',
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;
    
    @ApiProperty({
    description: 'Number of items per page',
    example: '10',
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100) // Giới hạn tối đa 100 items/trang
    limit: number = 36;
}