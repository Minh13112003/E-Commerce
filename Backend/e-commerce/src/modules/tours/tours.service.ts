import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TourResponseDto } from './dtos/tour-response.dto';
import { CreateTourDTO } from './dtos/create-tour.dto';
import { UpdateTourDTO } from './dtos/update-tour.dto';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';
import { QueryTourTypeDto, QueryTopToursDto } from './dtos/query-tour-type.dto';
import { SlugifyHelper } from '../../common/helpers/slugify.helper';


@Injectable()
export class ToursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationsService: NotificationsService,
  ) {}


  async getAllTours(paginationDTO: PaginationQueryDto): Promise<PaginatedResponseDto<TourResponseDto>> {
    const { page, limit } = paginationDTO;
    const skip = (page - 1) * limit;

    const [tours, total] = await this.prisma.$transaction([
      this.prisma.tour.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include :{
          schedules: true,
          departures : true,
        }

      }),
      this.prisma.tour.count(),
    ]);

    return new PaginatedResponseDto(
      tours.map(t => this.mapToDto(t)),
      { total, page, limit }
    );
  }

  async getTourById(id: string): Promise<TourResponseDto> {
    const tour = await this.prisma.tour.findUnique({
      where: { id },
      include: {
        schedules : true,
        departures : true,
      }
    });
    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found`);
    }
    return this.mapToDto(tour);
  }

  async createBulkTours(toursDataString: string, images: Express.Multer.File[]): Promise<TourResponseDto[]> {
  let tours: CreateTourDTO[];

  try {
    tours = typeof toursDataString === 'string' ? JSON.parse(toursDataString) : toursDataString;
  } catch {
    throw new BadRequestException('Dữ liệu tours không phải JSON hợp lệ');
  }

  if (!Array.isArray(tours) || tours.length === 0) {
    throw new BadRequestException('Danh sách tours không được để trống');
  }

  if (!images?.length || tours.length !== images.length) {
    throw new BadRequestException(
      `Số lượng tours (${tours.length}) phải khớp số lượng ảnh (${images?.length ?? 0})`
    );
  }

  const uploadedPublicIds: string[] = [];

  // Bước 1: Upload tất cả ảnh song song
  let uploadResults: { imageURL: string; imagePublicId: string }[];
  try {
    uploadResults = await Promise.all(
      images.map(image => this.cloudinaryService.uploadImage(image, 'tours'))
    );
    uploadResults.forEach(r => uploadedPublicIds.push(r.imagePublicId));
  } catch (error) {
    if (uploadedPublicIds.length > 0) {
      await Promise.allSettled(
        uploadedPublicIds.map(id => this.cloudinaryService.deleteImage(id))
      );
    }
    throw new BadRequestException(`Lỗi khi upload ảnh: ${error?.message}`);
  }

  // Bước 2: Tạo tất cả tours trong DB song song
  let createdTours: TourResponseDto[];
  try {
    createdTours = await Promise.all(
      tours.map(async (dto, i) => {
        const uploaded = uploadResults[i];

        const createdTour = await this.prisma.tour.create({
          data: {
            name: dto.name,
            slug: await this.generateTourSlug(dto.name),
            duration: dto.duration,
            imageUrl: uploaded.imageURL,
            imagePublicId: uploaded.imagePublicId,
            departureFrom: dto.departureFrom,
            transport: dto.transport,
            included: dto.included ?? [],
            notIncluded: dto.notIncluded ?? [],
            notes: dto.notes,
            tourCountry: dto.tourCountry ?? null,
            tourRegion: dto.tourRegion ?? null,
            tourCity: dto.tourCity ?? null,
            tourType: dto.tourType ?? null,
            schedules: dto.schedules?.length
              ? {
                  createMany: {
                    data: dto.schedules.map(s => ({
                      dayNumber: s.dayNumber,
                      title: s.title,
                      morning: s.morning,
                      noon: s.noon,
                      afternoon: s.afternoon,
                      evening: s.evening,
                      night: s.night,
                      meals: s.meals,
                    })),
                  },
                }
              : undefined,
            departures: dto.departureDays?.length
              ? {
                  createMany: {
                    data: [
                      ...new Set(
                        dto.departureDays.map(day =>
                          new Date(day).toISOString().slice(0, 10)
                        )
                      ),
                    ].map(day => {
                      const departureDate = new Date(day);
                      const tourCode = this.generateTourCode(dto.name, departureDate);
                      return {
                        tourCode,
                        departureDate,
                        availableSeats: dto.availableSeats ?? 0,
                        price: dto.price,
                      };
                    }),
                  },
                }
              : undefined,
          },
          include: {
            schedules: { orderBy: { dayNumber: 'asc' } },
            departures: { orderBy: { departureDate: 'asc' } },
          },
        });

        return this.mapToDto(createdTour);
      })
    );
  } catch (error) {
    await Promise.allSettled(
      uploadedPublicIds.map(id => this.cloudinaryService.deleteImage(id))
    );
    throw new BadRequestException(`Lỗi khi tạo tour: ${error?.message}`);
  }

  return createdTours;
}

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

  async updateTour(id: string, dto: UpdateTourDTO, image?: Express.Multer.File): Promise<TourResponseDto> {
    const existing = await this.prisma.tour.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Tour with ID ${id} not found`);
    }

    let imageUrl = existing.imageUrl;
    let imagePublicId = existing.imagePublicId;

    if (image) {
      if (existing.imagePublicId) {
        await this.cloudinaryService.deleteImage(existing.imagePublicId);
      }
      try {
        const uploaded = await this.cloudinaryService.uploadImage(image, 'tours');
        imageUrl = uploaded.imageURL;
        imagePublicId = uploaded.imagePublicId;
      } catch (error) {
        throw new BadRequestException('Failed to upload new image to Cloudinary');
      }
    }

    const updated = await this.prisma.tour.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        slug: dto.name ? await this.generateTourSlug(dto.name) : existing.slug,
        imageUrl: imageUrl,
        imagePublicId: imagePublicId,
        duration: dto.duration ?? existing.duration,
        included: dto.included !== undefined
          ? (dto.included.length === 1 && dto.included[0] === '__EMPTY_ARRAY__' ? [] : dto.included)
          : existing.included,
        notIncluded: dto.notIncluded !== undefined
          ? (dto.notIncluded.length === 1 && dto.notIncluded[0] === '__EMPTY_ARRAY__' ? [] : dto.notIncluded)
          : existing.notIncluded,
        notes: dto.notes !== undefined ? dto.notes : existing.notes,
        tourType: dto.tourType !== undefined ? dto.tourType : existing.tourType,
      },
    });

    return this.mapToDto(updated);
  }

  async deleteTour(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.tour.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Tour with ID ${id} not found`);
    }

    if (existing.imagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(existing.imagePublicId);
      } catch (error) {
        // Log error but proceed
      }
    }

    await this.prisma.tour.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Tour deleted successfully',
    };
  }

  async getNewestTours(query: QueryTopToursDto): Promise<PaginatedResponseDto<TourResponseDto>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [tours, total] = await this.prisma.$transaction([
      this.prisma.tour.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          schedules: { orderBy: { dayNumber: 'asc' } },
          departures: { orderBy: { departureDate: 'asc' } },
        },
      }),
      this.prisma.tour.count(),
    ]);

    return new PaginatedResponseDto(tours.map(t => this.mapToDto(t)), { total, page, limit });
  }

  async getHotTours(query: QueryTopToursDto): Promise<PaginatedResponseDto<TourResponseDto>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [tours, total] = await this.prisma.$transaction([
      this.prisma.tour.findMany({
        orderBy: { rating: 'desc' },
        skip,
        take: limit,
        include: {
          schedules: { orderBy: { dayNumber: 'asc' } },
          departures: { orderBy: { departureDate: 'asc' } },
        },
      }),
      this.prisma.tour.count(),
    ]);

    return new PaginatedResponseDto(tours.map(t => this.mapToDto(t)), { total, page, limit });
  }

  async getPopularTours(query: QueryTopToursDto): Promise<PaginatedResponseDto<TourResponseDto>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [tours, total] = await this.prisma.$transaction([
      this.prisma.tour.findMany({
        orderBy: [
          { bookings: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
        include: {
          schedules: { orderBy: { dayNumber: 'asc' } },
          departures: { orderBy: { departureDate: 'asc' } },
          _count: { select: { bookings: true } },
        },
      }),
      this.prisma.tour.count(),
    ]);

    return new PaginatedResponseDto(tours.map(t => this.mapToDto(t)), { total, page, limit });
  }

  async getToursByType(query: QueryTourTypeDto): Promise<PaginatedResponseDto<TourResponseDto>> {
    const { country, region, city, tourType, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // Lọc phân cấp:
    // - country, region: exact match (giá trị chuẩn hóa như "Trong nước", "Miền Bắc")
    // - city: contains + insensitive (1 tour có thể gồm nhiều thành phố, VD "Đà Nẵng - Huế - Quảng Bình")
    const where: any = {};
    if (country) where.tourCountry = country;
    if (region) where.tourRegion = region;
    if (tourType) where.tourType = tourType;
    if (city) {
      const searchSlug = await SlugifyHelper.slugify(city);
      where.OR = [
        { slug: { contains: searchSlug } },
        { tourCity: { contains: city, mode: 'insensitive' } },
      ];
    }

    const [tours, total] = await this.prisma.$transaction([
      this.prisma.tour.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          schedules: { orderBy: { dayNumber: 'asc' } },
          departures: { orderBy: { departureDate: 'asc' } },
        },
      }),
      this.prisma.tour.count({ where }),
    ]);

    return new PaginatedResponseDto(
      tours.map(t => this.mapToDto(t)),
      { total, page, limit },
    );
  }

  async rateTour(id: string, userRating: number): Promise<TourResponseDto> {
    const tour = await this.prisma.tour.findUnique({
      where: { id },
    });
    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found`);
    }

    const oldRating = Number(tour.rating);
    const oldCount = tour.reviewsCount;
    const newCount = oldCount + 1;
    const newRating = ((oldRating * oldCount) + userRating) / newCount;
    const roundedRating = Math.round(newRating * 10) / 10;

    const updated = await this.prisma.tour.update({
      where: { id },
      data: {
        rating: roundedRating,
        reviewsCount: newCount,
      },
    });

    return this.mapToDto(updated);
  }

  // Cập nhật lịch trình theo ngày → thông báo toàn bộ user đang đặt tour này
  async updateSchedules(
    tourId: string,
    schedules: Array<{
      dayNumber: number;
      title?: string;
      morning?: string;
      noon?: string;
      afternoon?: string;
      evening?: string;
      night?: string;
      meals?: string[];
    }>,
  ): Promise<TourResponseDto> {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      include: { schedules: { orderBy: { dayNumber: 'asc' } }, departures: true },
    });
    if (!tour) throw new NotFoundException(`Tour with ID ${tourId} not found`);

    // Upsert từng ngày trong lịch trình
    await Promise.all(
      schedules.map(s =>
        this.prisma.tourSchedule.upsert({
          where: { tourId_dayNumber: { tourId, dayNumber: s.dayNumber } },
          update: {
            ...(s.title !== undefined && { title: s.title }),
            ...(s.morning !== undefined && { morning: s.morning }),
            ...(s.noon !== undefined && { noon: s.noon }),
            ...(s.afternoon !== undefined && { afternoon: s.afternoon }),
            ...(s.evening !== undefined && { evening: s.evening }),
            ...(s.night !== undefined && { night: s.night }),
            ...(s.meals !== undefined && { meals: s.meals }),
          },
          create: {
            tourId,
            dayNumber: s.dayNumber,
            title: s.title ?? `Ngày ${s.dayNumber}`,
            morning: s.morning,
            noon: s.noon,
            afternoon: s.afternoon,
            evening: s.evening,
            night: s.night,
            meals: s.meals ?? [],
          },
        }),
      ),
    );

    // Thông báo user có booking PENDING/CONFIRMED/PAID cho bất kỳ departure nào của tour
    const bookedUsers = await this.prisma.booking.findMany({
      where: {
        idTour: tourId,
        status: { in: ['PENDING', 'CONFIRMED', 'PAID'] },
      },
      select: { idUser: true },
      distinct: ['idUser'],
    });

    await Promise.all(
      bookedUsers.map(b =>
        this.notificationsService.createNotification(
          b.idUser,
          NotificationType.SCHEDULE_UPDATED,
          'Lịch trình tour thay đổi',
          `Lịch trình tour ${tour.name} vừa được cập nhật. Vui lòng kiểm tra chi tiết chuyến đi của bạn.`,
          tourId,
          'TOUR',
        ),
      ),
    );

    const updated = await this.prisma.tour.findUnique({
      where: { id: tourId },
      include: { schedules: { orderBy: { dayNumber: 'asc' } }, departures: true },
    });
    return this.mapToDto(updated);
  }

  private async generateTourSlug(name: string): Promise<string> {
    const nameWithoutParentheses = name.replace(/\([^)]*\)/g, '');
    return SlugifyHelper.slugify(nameWithoutParentheses);
  }

  private mapToDto(tour: any): TourResponseDto {
    return {
      id: tour.id,
      name: tour.name,
      slug: tour.slug,
      imageUrl: tour.imageUrl,
      imagePublicId: tour.imagePublicId,
      duration: tour.duration,
      rating: Number(tour.rating),
      reviewsCount: tour.reviewsCount,
      hasVat: tour.hasVat,
      departureFrom: tour.departureFrom,
      transport: tour.transport,
      included: tour.included,
      notIncluded: tour.notIncluded,
      notes: tour.notes,
      tourCountry: tour.tourCountry ?? null,
      tourRegion: tour.tourRegion ?? null,
      tourCity: tour.tourCity ?? null,
      tourType: tour.tourType ?? null,
      bookingCount: tour._count?.bookings,
      schedules: tour.schedules,
      departures: tour.departures,
    };
  }
}
