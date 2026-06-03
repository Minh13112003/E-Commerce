import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBookingDTO } from './create-booking.dto';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBookingDTO extends PartialType(CreateBookingDTO) {
  @ApiProperty({
    type: String,
    description: 'Status of the booking',
    example: 'Đã nhận hàng',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    type: Date,
    description: 'Date of the booking',
    example: '2026-06-03T00:00:00.000Z',
    required: false,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  bookingDate?: Date;
}
