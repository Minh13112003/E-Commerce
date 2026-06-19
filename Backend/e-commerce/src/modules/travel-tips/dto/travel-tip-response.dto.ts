import { ApiProperty } from '@nestjs/swagger';

export class TravelTipResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() excerpt: string;
  @ApiProperty() content: string;
  @ApiProperty() imageUrl: string;
  @ApiProperty() imagePublicId: string;
  @ApiProperty() destination: string;
  @ApiProperty({ type: [String] }) tags: string[];
  @ApiProperty({ required: false, nullable: true }) relatedSearchQuery: string | null;
  @ApiProperty() isPublished: boolean;
  @ApiProperty() publishedAt: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
