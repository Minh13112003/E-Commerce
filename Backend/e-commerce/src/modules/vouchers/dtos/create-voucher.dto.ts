import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, Max, Min, IsBoolean } from 'class-validator';
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
    description: 'Discount value (percentage )',
    example: 50,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Max(100)
  @Min(1)
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

  @ApiProperty({
    type: String,
    description: 'ID of the user who created the voucher',
    example: 'u-admin-1',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  usercreatedId?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Status of the voucher (can be used or not)',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @ApiProperty({
    type: String,
    description: 'ID of the user assigned to this voucher',
    example: 'u-user-2',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Whether the voucher can be reused multiple times',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  reuse?: boolean;
}
