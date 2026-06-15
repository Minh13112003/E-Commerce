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

export class PassengerBreakdownDto {
  @ApiProperty({ type: Number, example: 2, description: 'Số người lớn' })
  adults: number;

  @ApiProperty({ type: Number, example: 6590000, description: 'Giá/người lớn (100%)' })
  adultUnitPrice: number;

  @ApiProperty({ type: Number, example: 13180000, description: 'Tổng tiền người lớn' })
  adultTotal: number;

  @ApiProperty({ type: Number, example: 1, description: 'Số trẻ em' })
  children: number;

  @ApiProperty({ type: Number, example: 5272000, description: 'Giá/trẻ em (80%)' })
  childUnitPrice: number;

  @ApiProperty({ type: Number, example: 5272000, description: 'Tổng tiền trẻ em' })
  childTotal: number;

  @ApiProperty({ type: Number, example: 0, description: 'Số em bé' })
  infants: number;

  @ApiProperty({ type: Number, example: 2636000, description: 'Giá/em bé (40%)' })
  infantUnitPrice: number;

  @ApiProperty({ type: Number, example: 0, description: 'Tổng tiền em bé' })
  infantTotal: number;
}

export class BookingResponseDto {
  @ApiProperty({ type: String, example: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, example: 'user-uuid' })
  idUser!: string;

  @ApiProperty({ type: TourResponseDto })
  tour!: TourResponseDto;

  @ApiProperty({ type: DepartureInfoDto, nullable: true })
  departure!: DepartureInfoDto | null;

  @ApiProperty({ type: Number, example: 3, description: 'Tổng số hành khách (adults + children + infants)' })
  quantity!: number;

  @ApiProperty({ type: PassengerBreakdownDto, description: 'Chi tiết số lượng & giá từng loại hành khách' })
  passengers!: PassengerBreakdownDto;

  @ApiProperty({ type: Number, example: 18452000, description: 'Tổng tiền gốc trước giảm giá' })
  originalPrice!: number;

  @ApiProperty({ type: Number, example: 1845200, description: 'Số tiền được giảm từ voucher' })
  discountAmount!: number;

  @ApiProperty({ type: Number, example: 16606800, description: 'Tiền thanh toán sau giảm giá' })
  price!: number;

  @ApiProperty({ type: String, example: 'AT_OFFICE' })
  paymentMethod!: string;

  @ApiProperty({ type: VoucherResponseDto, nullable: true })
  voucher!: VoucherResponseDto | null;

  @ApiProperty({ type: String, example: 'Cần hỗ trợ xe lăn', nullable: true })
  notice!: string | null;

  @ApiProperty({ type: String, example: 'PENDING' })
  status!: string;

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiProperty({ type: Date })
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
