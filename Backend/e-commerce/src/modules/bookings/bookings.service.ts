import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingResponseDto, DashboardOverviewResponseDto } from './dtos/booking-response.dto';
import { CreateBookingDTO } from './dtos/create-booking.dto';
import { UpdateBookingDTO } from './dtos/update-booking.dto';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
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
      where: { userId },
    });

    const recentBookings = await this.prisma.booking.findMany({
      where: { userId },
      orderBy: { bookingDate: 'desc' },
      take: 5,
    });

    return {
      toursCount,
      rewardPoints: user.rewardPoints,
      recentOrders: recentBookings.map(b => this.mapToDto(b)),
    };
  }

  async getHistory(userId: string): Promise<BookingResponseDto[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      orderBy: { bookingDate: 'desc' },
    });

    return bookings.map(b => this.mapToDto(b));
  }

  async createBooking(dto: CreateBookingDTO, userId: string, image: Express.Multer.File | undefined): Promise<BookingResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let uploadedImage: { imageURL: string; imagePublicId: string } | null = null;
    if (image) {
      try {
        uploadedImage = await this.cloudinaryService.uploadImage(image, 'bookings');
      } catch (error) {
        throw new BadRequestException('Failed to upload image');
      }
    } else {
      throw new BadRequestException('Booking image is required');
    }

    const namePart = ((user.firstName || '') + (user.lastName || '')).toUpperCase().replace(/[^A-Z]/g, '');
    const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `BTT${namePart}${datePart}${randPart}`.substring(0, 30);

    const booking = await this.prisma.booking.create({
      data: {
        orderCode,
        tourName: dto.tourName,
        imageUrl: uploadedImage.imageURL,
        imagePublicId: uploadedImage.imagePublicId,
        price: dto.price,
        currency: dto.currency || 'VND',
        status: 'Đang xử lý', // default status
        hasVat: dto.hasVat ?? true,
        bookingDate: new Date(), // default date
        userId,
      },
    });

    return this.mapToDto(booking);
  }

  async getBookingById(id: string, userId: string): Promise<BookingResponseDto> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, userId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or not owned by user');
    }

    return this.mapToDto(booking);
  }

  async updateBooking(id: string, dto: UpdateBookingDTO, userId: string, image?: Express.Multer.File): Promise<BookingResponseDto> {
    const existing = await this.prisma.booking.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Booking not found or not owned by user');
    }

    let imageUrl = existing.imageUrl;
    let imagePublicId = existing.imagePublicId;

    if (image) {
      if (existing.imagePublicId) {
        await this.cloudinaryService.deleteImage(existing.imagePublicId);
      }
      try {
        const uploadedImage = await this.cloudinaryService.uploadImage(image, 'bookings');
        imageUrl = uploadedImage.imageURL;
        imagePublicId = uploadedImage.imagePublicId;
      } catch (error) {
        throw new BadRequestException('Failed to upload image');
      }
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        tourName: dto.tourName,
        imageUrl,
        imagePublicId,
        price: dto.price,
        currency: dto.currency,
        status: dto.status,
        hasVat: dto.hasVat,
        bookingDate: dto.bookingDate,
      },
    });

    return this.mapToDto(updated);
  }

  async deleteBooking(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.booking.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Booking not found or not owned by user');
    }

    if (existing.imagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(existing.imagePublicId);
      } catch (error) {
        // Log error but proceed to delete from DB
      }
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
    return {
      id: booking.id,
      orderCode: booking.orderCode,
      tourName: booking.tourName,
      imageUrl: booking.imageUrl,
      price: Number(booking.price),
      currency: booking.currency,
      status: booking.status,
      hasVat: booking.hasVat,
      bookingDate: booking.bookingDate.toISOString().split('T')[0],
    };
  }
}
