import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max } from 'class-validator';

export class CategoryResponseDTO {
  @ApiProperty({
    description: 'A unique string that identifies the category.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  id!: string;
  @ApiProperty({
    description: 'The name of the category.',
    example: 'Electronics',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
  @ApiProperty({
    description: 'A brief description of the category.',
    example: 'Devices and gadgets for electronic use.',
  })
  description!: string;
  @ApiProperty({
    description: 'A URL-friendly version of the category name.',
    example: 'electronics',
  })
  slug!: string;
  @ApiProperty({
    description: 'The URL of the category image.',
    example: 'https://example.com/images/electronics.jpg',
  })
  imageURL?: string | null;
  @ApiProperty({
    description: 'The public ID of the category image in Cloudinary.',
    example: 'categories/abc123',
  })
  imagePublicId?: string | null;
  @ApiProperty({
    description: 'Indicates if the category is active.',
    example: true,
  })
  isActive!: boolean;
  @ApiProperty({
    description: 'The date and time when the category was created.',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;
  @ApiProperty({
    description: 'The date and time when the category was last updated.',
    example: '2023-01-02T00:00:00.000Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'The number of products associated with this category.',
    example: 42,
    maximum: 100000,
  })
  @IsNumber()
  @IsNotEmpty()
  @Max(100000, { message: 'Product count cannot exceed 1000.' })
  productCount?: number;
}
