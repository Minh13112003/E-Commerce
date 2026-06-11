import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum BookingStatusDto {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatusDto, example: BookingStatusDto.CONFIRMED })
  @IsEnum(BookingStatusDto)
  status: BookingStatusDto;
}
