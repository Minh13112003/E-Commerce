import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProductDTO } from './create-product.dto';
import { IsOptional, IsString } from 'class-validator';
import { Exclude } from 'class-transformer';

export class UpdateProductDTO extends PartialType(CreateProductDTO) {
  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'Mobile Phones',
    description:
      'Primary category name. If not provided, the first item in categoryNames will be used.',
    type: String,
  })
  primaryCategoryName?: string;

  @IsOptional()
  @Exclude() // Quan trọng: loại khỏi validation
  image?: Express.Multer.File;
}
