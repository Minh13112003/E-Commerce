import { ApiProperty } from '@nestjs/swagger';

export class VoucherResponseDto {
  @ApiProperty({ type: String, example: 'v1' })
  id!: string;

  @ApiProperty({ type: String, example: 'BTT300K' })
  code!: string;

  @ApiProperty({ type: String, example: 'Giảm 5% tối đa 300k' })
  title!: string;

  @ApiProperty({ type: String, example: 'VOUCHER PHỤ KIỆN' })
  subtitle!: string;

  @ApiProperty({ type: String, example: 'HSD: 05/06/2026' })
  expiry!: string;

  @ApiProperty({ type: String, example: 'HAPPY NEW YEAR 2026' })
  tag!: string;

  @ApiProperty({ type: String, example: 'Áp dụng cho khách hàng mua phụ kiện du lịch tại các chi nhánh BenThanh Tourist toàn quốc.' })
  description!: string;

  @ApiProperty({ type: Number, example: 50000 })
  value!: number;

  @ApiProperty({ type: Number, example: 300000, nullable: true })
  max!: number | null;

  @ApiProperty({ type: String, example: 'u-admin-1', nullable: true })
  usercreatedId!: string | null;

  @ApiProperty({ type: Boolean, example: true })
  status!: boolean;

  @ApiProperty({ type: String, example: 'u-user-2', nullable: true })
  userId!: string | null;

  @ApiProperty({ type: Boolean, example: false })
  reuse!: boolean;
}
