import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDepartureDto } from './dtos/create-departure.dto';
import { UpdateDepartureDto } from './dtos/update-departure.dto';
import { DepartureResponseDto } from './dtos/departure-response.dto';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';

@Injectable()
export class DeparturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private generateTourCode(tourName: string, departureDate: Date): string {
    const abbreviation = tourName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 5);

    const dateStr = departureDate.toISOString().slice(0, 10).replace(/-/g, '');
    return `BTT${abbreviation}${dateStr}`;
  }

  private mapToDto(departure: any): DepartureResponseDto {
    return {
      id: departure.id,
      tourCode: departure.tourCode,
      tourId: departure.tourId,
      departureDate: departure.departureDate,
      availableSeats: departure.availableSeats,
      price: Number(departure.price),
      createdAt: departure.createdAt,
      updatedAt: departure.updatedAt,
      tourName: departure.tour?.name ?? '',
      tourImageUrl: departure.tour?.imageUrl ?? '',
    };
  }

  async create(dto: CreateDepartureDto): Promise<DepartureResponseDto> {
    const tour = await this.prisma.tour.findUnique({ where: { id: dto.tourId } });
    if (!tour) throw new NotFoundException('Tour not found');

    const departureDate = new Date(dto.departureDate);
    const tourCode = this.generateTourCode(tour.name, departureDate);

    const departure = await this.prisma.departure.create({
      data: {
        tourId: dto.tourId,
        departureDate,
        availableSeats: dto.availableSeats,
        price: dto.price,
        tourCode,
      },
    });

    return this.mapToDto(departure);
  }

  async findAll(pagination: PaginationQueryDto): Promise<PaginatedResponseDto<DepartureResponseDto>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [departures, total] = await this.prisma.$transaction([
      this.prisma.departure.findMany({
        orderBy: [
          { tourId: 'asc' },
          { departureDate: 'asc' },
        ],
        include: {
          tour: { select: { name: true, imageUrl: true } }
        },
        skip,
        take: limit,
      }),
      this.prisma.departure.count(),
    ]);

    return new PaginatedResponseDto(departures.map(d => this.mapToDto(d)), { total, page, limit });
  }

  async findOne(id: string): Promise<DepartureResponseDto> {
    const departure = await this.prisma.departure.findUnique({
      where: { id },
      include: { tour: { select: { name: true, imageUrl: true } } },
    });
    if (!departure) throw new NotFoundException('Departure not found');
    return this.mapToDto(departure);
  }

  async findByTourId(tourId: string): Promise<DepartureResponseDto[]> {
    const departures = await this.prisma.departure.findMany({
      where: { tourId },
      orderBy: { departureDate: 'asc' },
      include: { tour: { select: { name: true, imageUrl: true } } },
    });
    return departures.map(d => this.mapToDto(d));
  }

  async update(id: string, dto: UpdateDepartureDto): Promise<DepartureResponseDto> {
    const existing = await this.prisma.departure.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Departure not found');

    const isDateChanging =
      !!dto.departureDate &&
      new Date(dto.departureDate).toDateString() !== existing.departureDate.toDateString();

    let tourCode = existing.tourCode;
    let tour: { id: string; name: string } | null = null;

    if (dto.departureDate || dto.tourId) {
      const tourId = dto.tourId ?? existing.tourId;
      tour = await this.prisma.tour.findUnique({ where: { id: tourId }, select: { id: true, name: true } });
      if (!tour) throw new NotFoundException('Tour not found');
      const date = dto.departureDate ? new Date(dto.departureDate) : existing.departureDate;
      tourCode = this.generateTourCode(tour.name, date);
    }

    const updated = await this.prisma.departure.update({
      where: { id },
      data: {
        ...(dto.tourId && { tourId: dto.tourId }),
        ...(dto.departureDate && { departureDate: new Date(dto.departureDate) }),
        ...(dto.availableSeats !== undefined && { availableSeats: dto.availableSeats }),
        ...(dto.price !== undefined && { price: dto.price }),
        tourCode,
      },
      include: { tour: { select: { name: true, imageUrl: true } } },
    });

    // Khi ngày khởi hành thay đổi → thông báo tất cả user đã đặt chuyến này
    if (isDateChanging) {
      const oldDate = existing.departureDate.toLocaleDateString('vi-VN');
      const newDate = new Date(dto.departureDate!).toLocaleDateString('vi-VN');
      const tourName = tour?.name ?? '';

      const bookedUsers = await this.prisma.booking.findMany({
        where: {
          departureId: id,
          status: { in: ['PENDING', 'CONFIRMED', 'PAID'] },
        },
        select: { idUser: true },
      });

      const reasonSuffix = dto.reason ? ` Lý do: ${dto.reason}.` : ' Vui lòng kiểm tra lại lịch trình của bạn.';
      await Promise.all(
        bookedUsers.map(b =>
          this.notificationsService.createNotification(
            b.idUser,
            NotificationType.DEPARTURE_RESCHEDULED,
            'Lịch khởi hành thay đổi',
            `Tour ${tourName} (${tourCode}) đã được dời ngày từ ${oldDate} sang ${newDate}.${reasonSuffix}`,
            updated.tourId,
            'TOUR',
          ),
        ),
      );
    }

    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.departure.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Departure not found');

    await this.prisma.departure.delete({ where: { id } });
    return { success: true, message: 'Departure deleted successfully' };
  }
}
