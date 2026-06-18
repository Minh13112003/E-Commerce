import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RoleGuard } from '../../common/guard/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { StatsService } from './stats.service';
import {
  BookingByStatusItemDto,
  MonthlyBookingItemDto,
  MonthlyUserItemDto,
  OverviewStatsDto,
  TopTourItemDto,
} from './dtos/stats-response.dto';

@ApiTags('Stats')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(Role.ADMIN)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: '[Admin] Tổng quan: số tour, booking, user, doanh thu' })
  @ApiResponse({ status: 200, type: OverviewStatsDto })
  getOverview(): Promise<OverviewStatsDto> {
    return this.statsService.getOverview();
  }

  @Get('bookings/monthly')
  @ApiOperation({ summary: '[Admin] Booking theo tháng — dữ liệu Line chart' })
  @ApiQuery({ name: 'months', required: false, type: Number, example: 12, description: 'Số tháng nhìn lại (mặc định 12)' })
  @ApiResponse({ status: 200, type: [MonthlyBookingItemDto] })
  getMonthlyBookings(@Query('months') months?: string): Promise<MonthlyBookingItemDto[]> {
    return this.statsService.getMonthlyBookings(Number(months ?? 12));
  }

  @Get('bookings/by-status')
  @ApiOperation({ summary: '[Admin] Booking theo trạng thái — dữ liệu Donut chart' })
  @ApiResponse({ status: 200, type: [BookingByStatusItemDto] })
  getBookingsByStatus(): Promise<BookingByStatusItemDto[]> {
    return this.statsService.getBookingsByStatus();
  }

  @Get('tours/top')
  @ApiOperation({ summary: '[Admin] Top tour bán chạy nhất' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5, description: 'Số lượng tour hiển thị (mặc định 5)' })
  @ApiResponse({ status: 200, type: [TopTourItemDto] })
  getTopTours(@Query('limit') limit?: string): Promise<TopTourItemDto[]> {
    return this.statsService.getTopTours(Number(limit ?? 5));
  }

  @Get('users/monthly')
  @ApiOperation({ summary: '[Admin] Người dùng mới theo tháng — dữ liệu Line chart' })
  @ApiQuery({ name: 'months', required: false, type: Number, example: 12, description: 'Số tháng nhìn lại (mặc định 12)' })
  @ApiResponse({ status: 200, type: [MonthlyUserItemDto] })
  getMonthlyNewUsers(@Query('months') months?: string): Promise<MonthlyUserItemDto[]> {
    return this.statsService.getMonthlyNewUsers(Number(months ?? 12));
  }
}
