import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OverviewStatsDto,
  MonthlyBookingItemDto,
  BookingByStatusItemDto,
  TopTourItemDto,
  MonthlyUserItemDto,
} from './dtos/stats-response.dto';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 1. Tổng quan (stat cards) ─────────────────────────────────────────────

  async getOverview(): Promise<OverviewStatsDto> {
    const [tourCount, departureCount, bookingCount, userCount, pendingBookingCount, revenueResult] =
      await this.prisma.$transaction([
        this.prisma.tour.count(),
        this.prisma.departure.count(),
        this.prisma.booking.count(),
        this.prisma.user.count(),
        this.prisma.booking.count({ where: { status: 'PENDING' } }),
        this.prisma.booking.aggregate({
          _sum: { price: true },
          where: { status: { in: ['PAID', 'ONGOING', 'COMPLETED'] } },
        }),
      ]);

    return {
      tourCount,
      departureCount,
      bookingCount,
      userCount,
      pendingBookingCount,
      totalRevenue: Number(revenueResult._sum.price ?? 0),
    };
  }

  // ─── 2. Booking theo tháng (Line chart) ────────────────────────────────────

  async getMonthlyBookings(months: number): Promise<MonthlyBookingItemDto[]> {
    const rows = await this.prisma.$queryRaw<
      { month: string; bookingCount: number; revenue: number }[]
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
        COUNT(*)::int                                          AS "bookingCount",
        COALESCE(SUM(price)::float, 0)                        AS revenue
      FROM bookings
      WHERE "createdAt" >= NOW() - (${months} || ' months')::interval
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `;

    return rows.map(r => ({
      month: r.month,
      bookingCount: Number(r.bookingCount),
      revenue: Number(r.revenue),
    }));
  }

  // ─── 3. Booking theo trạng thái (Donut chart) ──────────────────────────────

  async getBookingsByStatus(): Promise<BookingByStatusItemDto[]> {
    const groups = await this.prisma.booking.groupBy({
      by: ['status'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return groups.map(g => ({
      status: g.status,
      count: g._count.id,
    }));
  }

  // ─── 4. Top tours bán chạy ─────────────────────────────────────────────────

  async getTopTours(limit: number): Promise<TopTourItemDto[]> {
    const tours = await this.prisma.tour.findMany({
      orderBy: { bookingCount: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        imageUrl: true,
        tourCity: true,
        rating: true,
        bookingCount: true,
      },
    });

    return tours.map(t => ({
      id: t.id,
      name: t.name,
      imageUrl: t.imageUrl,
      tourCity: t.tourCity,
      rating: t.rating,
      bookingCount: t.bookingCount,
    }));
  }

  // ─── 5. Người dùng mới theo tháng (Line chart phụ) ─────────────────────────

  async getMonthlyNewUsers(months: number): Promise<MonthlyUserItemDto[]> {
    const rows = await this.prisma.$queryRaw<
      { month: string; newUsers: number }[]
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
        COUNT(*)::int                                          AS "newUsers"
      FROM users
      WHERE "createdAt" >= NOW() - (${months} || ' months')::interval
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `;

    return rows.map(r => ({
      month: r.month,
      newUsers: Number(r.newUsers),
    }));
  }
}
