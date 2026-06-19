import { ApiProperty } from '@nestjs/swagger';
import { NewsCategory } from '@prisma/client';

export class NewsResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() title: string;
  @ApiProperty() excerpt: string;
  @ApiProperty() content: string;
  @ApiProperty() imageUrl: string;
  @ApiProperty() imagePublicId: string;
  @ApiProperty({ enum: NewsCategory }) category: NewsCategory;
  @ApiProperty() isPublished: boolean;
  @ApiProperty() publishedAt: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
