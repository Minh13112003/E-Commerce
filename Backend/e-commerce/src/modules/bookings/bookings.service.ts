import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingResponseDto, DashboardOverviewResponseDto } from './dtos/booking-response.dto';
import { CreateBookingDTO } from './dtos/create-booking.dto';
import { UpdateBookingDTO } from './dtos/update-booking.dto';
import { PaginationQueryDto } from 'src/common/dtos/pagination.dto';
import { PaginatedResponseDto } from 'src/common/dtos/pagination-response.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
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
      include: { tour: true, voucher: true },
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
        tour: {
          include: {
            schedules: true,
          },
        },
        voucher: true,
      },
    });

    return bookings.map(b => this.mapToDto(b));
  }

  async createBooking(dto: CreateBookingDTO, userId: string): Promise<BookingResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tour = await this.prisma.tour.findUnique({
      where: { id: dto.idTour },
    });
    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    const originalPrice = Number(tour.price) * dto.quantity;
    let finalPrice = originalPrice;
    let resolvedVoucherId: string | null = null;

    if (dto.voucherCode) {
      const voucher = await this.prisma.voucher.findUnique({
        where: { code: dto.voucherCode },
      });

      if (!voucher) {
        throw new NotFoundException('Voucher not found');
      }
      if (!voucher.status) {
        throw new BadRequestException('Voucher is inactive or has already been used');
      }
      if (voucher.userId && voucher.userId !== userId) {
        throw new BadRequestException('Voucher is not assigned to this user');
      }

      // Tính giảm giá: value là % giảm
      const discountByPercent = originalPrice * (voucher.value / 100);

      if (voucher.max === null || voucher.max === undefined) {
        // Không có max → giảm toàn bộ theo %
        finalPrice = originalPrice - discountByPercent;
      } else {
        // Có max → lấy min(discountByPercent, max) → nếu phần giảm < max thì lấy max
        // Ý của user: nếu số tiền sau giảm nhỏ hơn max thì lấy max (tức là finalPrice = max)
        const priceAfterDiscount = originalPrice - discountByPercent;
        if (priceAfterDiscount < voucher.max) {
          finalPrice = voucher.max;
        } else {
          finalPrice = priceAfterDiscount;
        }
      }

      // Đảm bảo giá không âm
      finalPrice = Math.max(0, finalPrice);
      resolvedVoucherId = voucher.id;

      // Đánh dấu voucher đã sử dụng nếu không reuse
      if (!voucher.reuse) {
        await this.prisma.voucher.update({
          where: { id: voucher.id },
          data: { status: false },
        });
      }
    }

    const booking = await this.prisma.booking.create({
      data: {
        idUser: userId,
        idTour: dto.idTour,
        quantity: dto.quantity,
        originalPrice: originalPrice,
        price: finalPrice,
        voucherId: resolvedVoucherId,
        notice: dto.notice ?? null,
      },
      include: { tour: true, voucher: true },
    });

    return this.mapToDto(booking);
  }

  async getBookingById(id: string, userId: string): Promise<BookingResponseDto> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, idUser: userId },
      include: {
        tour: {
          include: {
            schedules: true,
          },
        },
        voucher: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or not owned by user');
    }

    return this.mapToDto(booking);
  }

  async getAllBookingsByUserId(userId : string, paginationDTO : PaginationQueryDto) : Promise<PaginatedResponseDto<BookingResponseDto>> {
    const {page , limit} = paginationDTO
    const skip = (page - 1) * limit
    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where : {idUser : userId},
        orderBy : {createdAt : 'desc'},
        include : {tour : {
          include : {schedules : true}
        }, voucher: true},
        skip: skip,
        take: limit
      }),
      this.prisma.booking.count({
        where : {idUser : userId},
      })
    ])
    return new PaginatedResponseDto(bookings.map(b => this.mapToDto(b)), {
      total: total,
      page: page,
      limit: limit
    })
  }

  async updateBooking(id: string, dto: UpdateBookingDTO, userId: string): Promise<BookingResponseDto> {
    const existing = await this.prisma.booking.findFirst({
      where: { id, idUser: userId },
    });

    if (!existing) {
      throw new NotFoundException('Booking not found or not owned by user');
    }

    if (dto.idTour) {
      const tour = await this.prisma.tour.findUnique({
        where: { id: dto.idTour },
      });
      if (!tour) {
        throw new NotFoundException('Tour not found');
      }
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        idTour: dto.idTour || existing.idTour,
      },
      include: { tour: true, voucher: true },
    });

    return this.mapToDto(updated);
  }

  async deleteBooking(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.booking.findFirst({
      where: { id, idUser: userId },
    });

    if (!existing) {
      throw new NotFoundException('Booking not found or not owned by user');
    }

    await this.prisma.booking.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Booking deleted successfully',
    };
  }

  private mapToDto(booking: any): BookingResponseDto {
    const originalPrice = Number(booking.originalPrice ?? booking.price);
    const finalPrice = Number(booking.price);
    const discountAmount = Math.max(0, originalPrice - finalPrice);

    return {
      id: booking.id,
      idUser: booking.idUser,
      tour: {
        id: booking.tour.id,
        name: booking.tour.name,
        imageUrl: booking.tour.imageUrl,
        imagePublicId: booking.tour.imagePublicId,
        price: Number(booking.tour.price),
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
      quantity: booking.quantity,
      originalPrice,
      discountAmount,
      price: finalPrice,
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
