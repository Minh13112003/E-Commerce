import { ApiProperty } from '@nestjs/swagger';
import { TourResponseDto } from '../../tours/dtos/tour-response.dto';
import { VoucherResponseDto } from '../../vouchers/dtos/voucher-response.dto';

export class DepartureInfoDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  tourCode: string;

  @ApiProperty({ type: Date })
  departureDate: Date;

  @ApiProperty({ type: Number })
  availableSeats: number;

  @ApiProperty({ type: Number })
  price: number;
}

export class BookingResponseDto {
  @ApiProperty({ type: String, example: 'b1' })
  id!: string;

  @ApiProperty({ type: String, example: 'user-uuid' })
  idUser!: string;

  @ApiProperty({ type: TourResponseDto })
  tour!: TourResponseDto;

  @ApiProperty({ type: DepartureInfoDto, nullable: true })
  departure!: DepartureInfoDto | null;

  @ApiProperty({ type: Number, example: 2 })
  quantity!: number;

  @ApiProperty({ type: Number, example: 2000000, description: 'Giá gốc trước khi áp mã giảm giá' })
  originalPrice!: number;

  @ApiProperty({ type: Number, example: 200000, description: 'Số tiền được giảm từ voucher' })
  discountAmount!: number;

  @ApiProperty({ type: Number, example: 1800000, description: 'Giá sau khi áp mã giảm giá' })
  price!: number;

  @ApiProperty({ type: String, example: 'AT_OFFICE' })
  paymentMethod!: string;

  @ApiProperty({ type: VoucherResponseDto, nullable: true })
  voucher!: VoucherResponseDto | null;

  @ApiProperty({ type: String, example: 'Ghi chú thêm', nullable: true })
  notice!: string | null;

  @ApiProperty({ type: String, example: 'PENDING' })
  status!: string;

  @ApiProperty({ type: Date, example: '2022-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: Date, example: '2022-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}

export class DashboardOverviewResponseDto {
  @ApiProperty({ type: Number, example: 19 })
  toursCount!: number;

  @ApiProperty({ type: Number, example: 1000000 })
  rewardPoints!: number;

  @ApiProperty({ type: [BookingResponseDto] })
  recentOrders!: BookingResponseDto[];
}
