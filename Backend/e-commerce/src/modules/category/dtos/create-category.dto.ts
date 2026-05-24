import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDTO {
  @ApiProperty({
    description: 'The name of the category',
    example: 'Electronics',
    required: true,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'The description of the category',
    example: 'A category for electronic products',
    required: false,
    maxLength: 250,
  })
  @IsString()
  @MaxLength(250)
  description!: string;

  @ApiProperty({
    description: 'Indicates if the category is active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  isActive?: boolean;
}
