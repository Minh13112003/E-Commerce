import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingSchedulerService {
  private readonly logger = new Logger(BookingSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Parse "X ngày Y đêm" → số ngày (X).
   * Ví dụ: "3 ngày 2 đêm" → 3, "5 ngày 4 đêm" → 5
   */
  private parseDurationDays(duration: string): number | null {
    const match = duration.match(/(\d+)\s*ngày/i);
    if (!match) return null;
    return parseInt(match[1], 10);
  }

  /**
   * Chạy mỗi giờ.
   * 1. PAID → ONGOING  : khi departureDate <= now
   * 2. ONGOING → COMPLETED : khi departureDate + X ngày <= now
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoUpdateBookingStatuses(): Promise<void> {
    const now = new Date();
    this.logger.log(`[Scheduler] Running booking status check at ${now.toISOString()}`);

    await this.transitionPaidToOngoing(now);
    await this.transitionOngoingToCompleted(now);
  }

  // ─── PAID → ONGOING ────────────────────────────────────────────────────────

  private async transitionPaidToOngoing(now: Date): Promise<void> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'PAID',
        departure: {
          departureDate: { lte: now },
        },
      },
      include: { departure: true },
    });

    if (!bookings.length) return;

    this.logger.log(`[Scheduler] PAID → ONGOING: ${bookings.length} booking(s)`);

    for (const booking of bookings) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'ONGOING' },
      });

      const tourCode = booking.departure?.tourCode ?? booking.id;
      await this.notificationsService.createNotification(
        booking.idUser,
        NotificationType.BOOKING_STATUS_UPDATED,
        'Tour của bạn đã bắt đầu!',
        `Tour mã ${tourCode} đã chuyển sang trạng thái Đang diễn ra. Chúc bạn có chuyến đi vui vẻ!`,
        booking.idTour,
        'TOUR',
      );
    }
  }

  // ─── ONGOING → COMPLETED ───────────────────────────────────────────────────

  private async transitionOngoingToCompleted(now: Date): Promise<void> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'ONGOING',
        departure: { is: { tourId: { not: undefined } } },
      },
      include: {
        departure: true,
        tour: { select: { id: true, duration: true } },
      },
    });

    if (!bookings.length) return;

    const toComplete: typeof bookings = [];

    for (const booking of bookings) {
      if (!booking.departure || !booking.tour) continue;

      const days = this.parseDurationDays(booking.tour.duration);
      if (days === null) {
        this.logger.warn(
          `[Scheduler] Cannot parse duration "${booking.tour.duration}" for booking ${booking.id}`,
        );
        continue;
      }

      // Cách B: endDate = departureDate + X ngày (chính xác theo ms)
      const endDate = new Date(booking.departure.departureDate);
      endDate.setDate(endDate.getDate() + days);

      if (now >= endDate) {
        toComplete.push(booking);
      }
    }

    if (!toComplete.length) return;

    this.logger.log(`[Scheduler] ONGOING → COMPLETED: ${toComplete.length} booking(s)`);

    for (const booking of toComplete) {
      const pointsToAdd = Math.floor(Number(booking.price));

      await this.prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'COMPLETED' },
        });

        await tx.user.update({
          where: { id: booking.idUser },
          data: {
            rewardPoints: { increment: pointsToAdd },
            earnedPoints: { increment: pointsToAdd },
          },
        });

        await tx.tour.update({
          where: { id: booking.tour.id },
          data: { bookingCount: { increment: 1 } },
        });
      });

      const completedTourCode = booking.departure?.tourCode ?? booking.id;
      await this.notificationsService.createNotification(
        booking.idUser,
        NotificationType.BOOKING_STATUS_UPDATED,
        'Tour đã hoàn thành!',
        `Tour mã ${completedTourCode} đã hoàn thành. Bạn được cộng ${pointsToAdd.toLocaleString()} điểm thưởng vào tài khoản!`,
        booking.tour.id,
        'TOUR',
      );
    }
  }
}
