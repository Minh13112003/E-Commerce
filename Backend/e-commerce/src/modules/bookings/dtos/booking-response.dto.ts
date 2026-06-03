import { ApiProperty } from '@nestjs/swagger';

export class BookingResponseDto {
  @ApiProperty({ type: String, example: '1' })
  id!: string;

  @ApiProperty({ type: String, example: 'BTTDHCMKHOA20260327' })
  orderCode!: string;

  @ApiProperty({ type: String, example: 'Du lịch Hàn Quốc (Mùa Hoa Anh Đào): Seoul - Nami - Everland - Công viên Yeouido' })
  tourName!: string;

  @ApiProperty({ type: String, example: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500' })
  imageUrl!: string;

  @ApiProperty({ type: Number, example: 15990000 })
  price!: number;

  @ApiProperty({ type: String, example: 'VND' })
  currency!: string;

  @ApiProperty({ type: String, example: 'Đã nhận hàng' })
  status!: string;

  @ApiProperty({ type: Boolean, example: true })
  hasVat!: boolean;

  @ApiProperty({ type: String, example: '2026-06-03' })
  bookingDate!: string;
}

export class DashboardOverviewResponseDto {
  @ApiProperty({ type: Number, example: 19 })
  toursCount!: number;

  @ApiProperty({ type: Number, example: 1000000 })
  rewardPoints!: number;

  @ApiProperty({ type: [BookingResponseDto] })
  recentOrders!: BookingResponseDto[];
}
