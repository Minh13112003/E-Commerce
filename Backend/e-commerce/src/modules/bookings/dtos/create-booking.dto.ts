import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export enum PaymentMethodDto {
  AT_OFFICE = 'AT_OFFICE',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export class CreateBookingDTO {
  @ApiProperty({
    type: String,
    description: 'ID of the tour being booked',
    example: 't1',
  })
  @IsString()
  @IsNotEmpty()
  idTour!: string;

  @ApiProperty({
    type: String,
    description: 'ID of the departure (optional)',
    example: 'uuid',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  departureId?: string;

  @ApiProperty({
    type: Number,
    description: 'Quantity of the tour being booked',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => value ?? 1)
  quantity: number;

  @ApiProperty({
    enum: PaymentMethodDto,
    description: 'Payment method',
    example: PaymentMethodDto.AT_OFFICE,
    required: false,
  })
  @IsEnum(PaymentMethodDto)
  @IsOptional()
  paymentMethod?: PaymentMethodDto;

  @ApiProperty({
    type: String,
    description: 'Code of the voucher to apply for discount',
    example: 'BTT300K',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  voucherCode?: string;

  @ApiProperty({
    type: String,
    description: 'Additional notice/note for the booking',
    example: 'Chúng tôi cần hỗ trợ xe lăn',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  notice?: string;
}
