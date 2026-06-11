import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateDepartureDto {
  @ApiProperty({ type: String, description: 'Tour ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  tourId: string;

  @ApiProperty({ type: String, description: 'Departure date (ISO string)', example: '2026-06-10T00:00:00.000Z' })
  @IsDateString()
  departureDate: string;

  @ApiProperty({ type: Number, description: 'Available seats', example: 30 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  availableSeats: number;

  @ApiProperty({ type: Number, description: 'Price per person', example: 5000000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;
}
