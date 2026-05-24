import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ProductResponseDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'A unique string that identifies the product.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @IsOptional()
  @ApiProperty({
    description: 'The id of the primary category.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  primaryCategoryId: string | null = null;
  @ApiProperty({
    description: 'The name of the primary category.',
    example: 'Electronics',
  })
  primaryCategoryName: string | null = null;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The name of the product.',
    example: 'Smartphone XYZ',
  })
  name!: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'The names of the categories the product belongs to.',
    example: ['Electronics', 'Mobile Phones'],
    isArray: true,
    type: String,
  })
  categoryNames: string[] = [];

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'A brief description of the product.',
    example: 'A high-end smartphone with advanced features.',
  })
  description!: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The URL of the product image.',
    example: 'https://example.com/images/smartphone-xyz.jpg',
  })
  imageURL?: string | null = null;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The public ID of the product image in Cloudinary.',
    example: 'products/smartphone-xyz',
  })
  imagePublicId!: string | null;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The price of the product.',
    example: 100000,
  })
  price!: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @ApiProperty({
    description: 'The available stock quantity of the product.',
    example: 50,
  })
  stock!: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The SKU of the product.',
    example: 'SKU-123',
  })
  sku!: string;

  @IsOptional()
  @ApiProperty({
    description: 'Indicates if the product is active.',
    example: true,
  })
  isActive?: boolean = true;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @ApiProperty({
    description: 'The number of products in the category.',
    example: 100,
  })
  categoryProductCount!: number;

  @ApiProperty({
    description: 'The date and time when the product was created.',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'The date and time when the product was last updated.',
    example: '2024-01-02T00:00:00.000Z',
  })
  updatedAt!: Date;
}
