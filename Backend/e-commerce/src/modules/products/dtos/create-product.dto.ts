import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The name of the product.',
    example: 'Smartphone XYZ',
  })
  name!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'A brief description of the product.',
    example: 'A high-end smartphone with advanced features.',
  })
  description!: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Max(10000000000, { message: 'price cannot exceed 10000000000 VND.' })
  @Min(0, { message: 'price must be a positive number.' })
  @ApiProperty({
    description: 'The price of the product.',
    example: 999.99,
    minimum: 0,
    maximum: 10000000000,
  })
  price!: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Max(10000000000, { message: 'stock cannot exceed 10000000000.' })
  @Min(0, { message: 'stock must be a positive number.' })
  @ApiProperty({
    description: 'The stock quantity of the product.',
    example: 100,
    minimum: 0,
    maximum: 10000000000,
  })
  stock!: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'stock keeping unit, a unique identifier for the product.',
    example: 'WH-12345',
    maxLength: 100,
  })
  @MaxLength(100, { message: 'sku cannot exceed 100 characters.' })
  sku!: string;

  @IsOptional() // ← Thêm
  @IsBoolean()
  @ApiProperty({
    description: 'Indicates if the product is active.',
    example: true,
    default: true,
    required: false,
  })
  isActive?: boolean = true;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty({
    description: 'The names of the categories the product belongs to.',
    example: ['Electronics', 'Mobile Phones'],
    isArray: true,
    type: [String],
  })
  @Transform(({ value }) => {
    // multipart/form-data
    if (Array.isArray(value)) {
      return value
        .flatMap(v => (typeof v === 'string' ? v.split(',') : v))
        .map(v => v.trim())
        .filter(Boolean);
    }

    // single string
    if (typeof value === 'string') {
      return value
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);
    }

    return [];
  })
  @IsArray()
  categoryNames!: string[];
}
