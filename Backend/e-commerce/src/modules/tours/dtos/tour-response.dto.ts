import { ApiProperty } from '@nestjs/swagger';

export class TourResponseDto {
  @ApiProperty({ type: String, example: 't1' })
  id!: string;

  @ApiProperty({ type: String, example: 'Du lịch Hàn Quốc (Mùa Hoa Anh Đào): Seoul - Nami - Everland - Công viên Yeouido' })
  name!: string;

  @ApiProperty({ type: String, example: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500' })
  imageUrl!: string;

  @ApiProperty({ type: String, example: 'tours/f11n619f816v7q004l9b' })
  imagePublicId!: string;

  @ApiProperty({ type: Number, example: 15990000 })
  price!: number;

  @ApiProperty({ type: String, example: '5 Ngày 4 Đêm' })
  duration!: string;

  @ApiProperty({ type: Number, example: 4.9 })
  rating!: number;

  @ApiProperty({ type: Number, example: 124 })
  reviewsCount!: number;

  @ApiProperty({ type: Boolean, example: true })
  hasVat!: boolean;
}
