import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export enum PaymentMethodDto {
  AT_OFFICE = 'AT_OFFICE',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export class CreateBookingDTO {
  @ApiProperty({ type: String, description: 'ID của tour', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  idTour!: string;

  @ApiProperty({ type: String, description: 'ID của chuyến khởi hành', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  departureId: string;

  @ApiProperty({
    type: Number,
    description: 'Số người lớn (≥ 16 tuổi) — giá 100%',
    example: 2,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Số trẻ em (2–15 tuổi) — giá 80%. Mặc định: 0',
    example: 1,
    minimum: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  children?: number = 0;

  @ApiPropertyOptional({
    type: Number,
    description: 'Số em bé (dưới 2 tuổi) — giá 40%. Mặc định: 0',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  infants?: number = 0;

  @ApiPropertyOptional({
    enum: PaymentMethodDto,
    description: 'Phương thức thanh toán',
    example: PaymentMethodDto.AT_OFFICE,
  })
  @IsEnum(PaymentMethodDto)
  @IsOptional()
  paymentMethod?: PaymentMethodDto;

  @ApiPropertyOptional({
    type: String,
    description: 'Mã voucher giảm giá',
    example: 'BTT300K',
  })
  @IsString()
  @IsOptional()
  voucherCode?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Ghi chú thêm cho booking',
    example: 'Chúng tôi cần hỗ trợ xe lăn',
  })
  @IsString()
  @IsOptional()
  notice?: string;
}
