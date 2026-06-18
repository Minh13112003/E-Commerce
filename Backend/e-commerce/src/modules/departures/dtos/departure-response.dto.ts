import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartureResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  tourCode: string;

  @ApiProperty({ type: String })
  tourId: string;

  @ApiProperty({ type: Date })
  departureDate: Date;

  @ApiProperty({ type: Number })
  availableSeats: number;

  @ApiProperty({ type: Number })
  price: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: String })
  tourName?: string;

  @ApiPropertyOptional({ type: String })
  tourImageUrl?: string;
}
