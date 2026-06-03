import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';


export class CreateVoucherDTO {
  @ApiProperty({
    type: String,
    description: 'Unique voucher code',
    example: 'BTT300K',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    type: String,
    description: 'Voucher title',
    example: 'Giảm 5% tối đa 300k',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    type: String,
    description: 'Voucher subtitle',
    example: 'VOUCHER PHỤ KIỆN',
  })
  @IsString()
  @IsNotEmpty()
  subtitle!: string;

  @ApiProperty({
    type: String,
    description: 'Voucher expiry text (e.g. HSD: 05/06/2026)',
    example: 'HSD: 05/06/2026',
  })
  @IsString()
  @IsNotEmpty()
  expiry!: string;

  @ApiProperty({
    type: String,
    description: 'Voucher category/tag',
    example: 'HAPPY NEW YEAR 2026',
  })
  @IsString()
  @IsNotEmpty()
  tag!: string;

  @ApiProperty({
    type: String,
    description: 'Detailed description of the voucher terms',
    example: 'Áp dụng cho khách hàng mua phụ kiện du lịch tại các chi nhánh BenThanh Tourist toàn quốc.',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    type: Number,
    description: 'Discount value (percentage or flat amount)',
    example: 50000,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  value!: number;

  @ApiProperty({
    type: Number,
    description: 'Maximum discount amount',
    example: 300000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  max?: number;
}
