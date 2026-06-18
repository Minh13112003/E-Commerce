import { ApiProperty } from '@nestjs/swagger';

export class OverviewStatsDto {
  @ApiProperty({ example: 142 })
  tourCount: number;

  @ApiProperty({ example: 38 })
  departureCount: number;

  @ApiProperty({ example: 1247 })
  bookingCount: number;

  @ApiProperty({ example: 856 })
  userCount: number;

  @ApiProperty({ example: 34 })
  pendingBookingCount: number;

  @ApiProperty({ example: 5820000000 })
  totalRevenue: number;
}

export class MonthlyBookingItemDto {
  @ApiProperty({ example: '2026-01' })
  month: string;

  @ApiProperty({ example: 84 })
  bookingCount: number;

  @ApiProperty({ example: 712000000 })
  revenue: number;
}

export class BookingByStatusItemDto {
  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: 34 })
  count: number;
}

export class TopTourItemDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Tour Hà Nội - Hạ Long 4N3Đ' })
  name: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/...' })
  imageUrl: string;

  @ApiProperty({ example: 'Hà Nội - Hạ Long' })
  tourCity: string | null;

  @ApiProperty({ example: 4.8 })
  rating: number;

  @ApiProperty({ example: 45 })
  bookingCount: number;
}

export class MonthlyUserItemDto {
  @ApiProperty({ example: '2026-01' })
  month: string;

  @ApiProperty({ example: 23 })
  newUsers: number;
}
