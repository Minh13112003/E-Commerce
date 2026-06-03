import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDTO {
  @ApiProperty({
    type: String,
    description: 'Name of the tour',
    example: 'Du lịch Hàn Quốc (Mùa Hoa Anh Đào): Seoul - Nami - Everland - Công viên Yeouido',
  })
  @IsString()
  @IsNotEmpty()
  tourName!: string;

  @ApiProperty({
    type: Number,
    description: 'Price of the tour booking',
    example: 15990000,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  price!: number;

  @ApiProperty({
    type: String,
    description: 'Currency used (e.g. VND, USD)',
    example: 'VND',
    required: false,
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Whether the price includes VAT',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  hasVat?: boolean;
}
