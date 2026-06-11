import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import type { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingResponseDto, DashboardOverviewResponseDto } from './dtos/booking-response.dto';
import { CreateBookingDTO } from './dtos/create-booking.dto';
import { UpdateBookingDTO } from './dtos/update-booking.dto';
import { PaginationQueryDto } from 'src/common/dtos/pagination.dto';
import { PaginatedResponseDto } from 'src/common/dtos/pagination-response.dto';
import { NotificationsService } from '../notifications/notifications.service';

const STATUS_MESSAGES: Record<BookingStatus, string> = {
  CONFIRMED: 'Your booking has been confirmed.',
  PAID: 'Payment received. Thank you!',
  ONGOING: 'Your tour is now in progress. Enjoy!',
  COMPLETED: 'Your tour has ended. Thank you for traveling with us!',
  CANCELLED: 'Your booking has been cancelled.',
  REFUNDED: 'Your refund has been processed.',
  PENDING: 'Your booking is awaiting confirmation.',
};

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getDashboard(userId: string): Promise<DashboardOverviewResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { rewardPoints: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const toursCount = await this.prisma.booking.count({
      where: { idUser: userId },
    });

    const recentBookings = await this.prisma.booking.findMany({
      where: { idUser: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { tour: true, voucher: true, departure: true },
    });

    return {
      toursCount,
      rewardPoints: user.rewardPoints,
      recentOrders: recentBookings.map(b => this.mapToDto(b)),
    };
  }

  async getHistory(userId: string): Promise<BookingResponseDto[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { idUser: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        tour: { include: { schedules: true } },
        voucher: true,
        departure: true,
      },
    });

    return bookings.map(b => this.mapToDto(b));
  }

  async createBooking(dto: CreateBookingDTO, userId: string): Promise<BookingResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const tour = await tx.tour.findUnique({ where: { id: dto.idTour } });
      if (!tour) throw new NotFoundException('Tour not found');

      // Handle departure if provided
      let departure: any = null;
      if (dto.departureId) {
        departure = await tx.departure.findUnique({ where: { id: dto.departureId } });
        if (!departure) throw new NotFoundException('Departure not found');
        if (departure.availableSeats <= 0) {
          throw new BadRequestException('No available seats for this departure');
        }
      }

      // Price comes from departure if available, otherwise from tour (legacy)
      if (!departure) throw new BadRequestException('A departure must be selected to book a tour');
      const unitPrice = Number(departure.price);
      const originalPrice = unitPrice * dto.quantity;
      let finalPrice = originalPrice;
      let resolvedVoucherId: string | null = null;

      if (dto.voucherCode) {
        const voucher = await tx.voucher.findUnique({ where: { code: dto.voucherCode } });

        if (!voucher) throw new NotFoundException('Voucher not found');
        if (!voucher.status) throw new BadRequestException('Voucher is inactive or has already been used');
        if (voucher.userId && voucher.userId !== userId) {
          throw new BadRequestException('Voucher is not assigned to this user');
        }

        const discountByPercent = originalPrice * (voucher.value / 100);

        if (voucher.max === null || voucher.max === undefined) {
          finalPrice = originalPrice - discountByPercent;
        } else {
          const priceAfterDiscount = originalPrice - discountByPercent;
          finalPrice = priceAfterDiscount < voucher.max ? voucher.max : priceAfterDiscount;
        }

        finalPrice = Math.max(0, finalPrice);
        resolvedVoucherId = voucher.id;

        if (!voucher.reuse) {
          await tx.voucher.update({ where: { id: voucher.id }, data: { status: false } });
        }
      }

      const booking = await tx.booking.create({
        data: {
          idUser: userId,
          idTour: dto.idTour,
          departureId: dto.departureId ?? null,
          quantity: dto.quantity,
          originalPrice,
          price: finalPrice,
          voucherId: resolvedVoucherId,
          notice: dto.notice ?? null,
          paymentMethod: dto.paymentMethod ?? 'AT_OFFICE',
        },
        include: { tour: true, voucher: true, departure: true },
      });

      // Deduct seat from departure
      if (departure) {
        await tx.departure.update({
          where: { id: departure.id },
          data: { availableSeats: { decrement: 1 } },
        });
      }

      // Send notification
      await this.notificationsService.createNotification(
        userId,
        NotificationType.BOOKING_CREATED,
        'Booking Confirmed',
        `Your booking #${booking.id} has been placed successfully. Status: PENDING.`,
      );

      return this.mapToDto(booking);
    });
  }

  async getBookingById(id: string, userId: string): Promise<BookingResponseDto> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, idUser: userId },
      include: {
        tour: { include: { schedules: true } },
        voucher: true,
        departure: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found or not owned by user');
    return this.mapToDto(booking);
  }

  async getAllBookingsByUserId(userId: string, paginationDTO: PaginationQueryDto): Promise<PaginatedResponseDto<BookingResponseDto>> {
    const { page, limit } = paginationDTO;
    const skip = (page - 1) * limit;
    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where: { idUser: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          tour: { include: { schedules: true } },
          voucher: true,
          departure: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where: { idUser: userId } }),
    ]);
    return new PaginatedResponseDto(bookings.map(b => this.mapToDto(b)), { total, page, limit });
  }

  async updateBookingStatus(id: string, status: BookingStatus): Promise<BookingResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { departure: true },
      });

      if (!booking) throw new NotFoundException('Booking not found');

      if (booking.status === status) {
        throw new BadRequestException(`Booking is already in status: ${status}`);
      }

      // Restore seat on cancellation or refund
      if ((status === ('CANCELLED' as BookingStatus) || status === ('REFUNDED' as BookingStatus)) && booking.departureId) {
        await tx.departure.update({
          where: { id: booking.departureId },
          data: { availableSeats: { increment: 1 } },
        });
      }

      // Add reward points on completion
      if (status === ('COMPLETED' as BookingStatus)) {
        const pointsToAdd = Math.floor(Number(booking.price));
        await tx.user.update({
          where: { id: booking.idUser },
          data: {
            rewardPoints: { increment: pointsToAdd },
            earnedPoints: { increment: pointsToAdd },
          },
        });
      }

      const updated = await tx.booking.update({
        where: { id },
        data: { status },
        include: { tour: true, voucher: true, departure: true },
      });

      // Send notification
      await this.notificationsService.createNotification(
        booking.idUser,
        NotificationType.BOOKING_STATUS_UPDATED,
        'Booking Status Updated',
        STATUS_MESSAGES[status],
      );

      return this.mapToDto(updated);
    });
  }

  async updateBooking(id: string, dto: UpdateBookingDTO, userId: string): Promise<BookingResponseDto> {
    const existing = await this.prisma.booking.findFirst({ where: { id, idUser: userId } });
    if (!existing) throw new NotFoundException('Booking not found or not owned by user');

    if (dto.idTour) {
      const tour = await this.prisma.tour.findUnique({ where: { id: dto.idTour } });
      if (!tour) throw new NotFoundException('Tour not found');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { idTour: dto.idTour || existing.idTour },
      include: { tour: true, voucher: true, departure: true },
    });

    return this.mapToDto(updated);
  }

  async deleteBooking(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.booking.findFirst({ where: { id, idUser: userId } });
    if (!existing) throw new NotFoundException('Booking not found or not owned by user');

    await this.prisma.booking.delete({ where: { id } });
    return { success: true, message: 'Booking deleted successfully' };
  }

  private mapToDto(booking: any): BookingResponseDto {
    const originalPrice = Number(booking.originalPrice ?? booking.price);
    const price = Number(booking.price);
    const discountAmount = Math.max(0, originalPrice - price);

    return {
      id: booking.id,
      idUser: booking.idUser,
      tour: {
        id: booking.tour.id,
        name: booking.tour.name,
        imageUrl: booking.tour.imageUrl,
        imagePublicId: booking.tour.imagePublicId,
        duration: booking.tour.duration,
        rating: Number(booking.tour.rating),
        reviewsCount: booking.tour.reviewsCount,
        hasVat: booking.tour.hasVat,
        departureFrom: booking.tour.departureFrom,
        transport: booking.tour.transport,
        included: booking.tour.included,
        notIncluded: booking.tour.notIncluded,
        notes: booking.tour.notes,
        schedules: booking.tour.schedules,
      },
      departure: booking.departure ? {
        id: booking.departure.id,
        tourCode: booking.departure.tourCode,
        departureDate: booking.departure.departureDate,
        availableSeats: booking.departure.availableSeats,
        price: Number(booking.departure.price),
      } : null,
      quantity: booking.quantity,
      originalPrice,
      discountAmount,
      price,
      paymentMethod: booking.paymentMethod,
      voucher: booking.voucher ? {
        id: booking.voucher.id,
        code: booking.voucher.code,
        title: booking.voucher.title,
        subtitle: booking.voucher.subtitle,
        expiry: booking.voucher.expiry,
        tag: booking.voucher.tag,
        description: booking.voucher.description,
        value: booking.voucher.value,
        max: booking.voucher.max,
        usercreatedId: booking.voucher.usercreatedId,
        status: booking.voucher.status,
        userId: booking.voucher.userId,
        reuse: booking.voucher.reuse,
      } : null,
      notice: booking.notice ?? null,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      status: booking.status,
    };
  }
}
