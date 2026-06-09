import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { TourResponseDto } from './dtos/tour-response.dto';
import { CreateTourDTO } from './dtos/create-tour.dto';
import { UpdateTourDTO } from './dtos/update-tour.dto';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';

@Injectable()
export class ToursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
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
      throw new BadRequestException(`Số lượng tours (${tours.length}) phải khớp số lượng ảnh (${images?.length ?? 0})`);
    }

    const createdTours: TourResponseDto[] = [];

    for (let i = 0; i < tours.length; i++) {
      const dto = tours[i];
      const image = images[i];

      const uploaded = await this.cloudinaryService.uploadImage(image, 'tours');

      // Tạo Tour kết hợp Lịch trình (schedules) lồng nhau bằng prisma `create`
      const createdTour = await this.prisma.tour.create({
        data: {
          name: dto.name,
          price: dto.price,
          duration: dto.duration,
          imageUrl: uploaded.imageURL,
          imagePublicId: uploaded.imagePublicId,
          departureFrom: dto.departureFrom,
          transport: dto.transport,
          included: dto.included ?? [],
          notIncluded: dto.notIncluded ?? [],
          notes: dto.notes,
          schedules: dto.schedules ? {
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
          } : undefined,
        },
        include: { schedules: { orderBy: { dayNumber: 'asc' } } },
      });

      createdTours.push(this.mapToDto(createdTour));
    }

    return createdTours;
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
        imageUrl: imageUrl,
        imagePublicId: imagePublicId,
        price: dto.price ?? existing.price,
        duration: dto.duration ?? existing.duration,
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

  private mapToDto(tour: any): TourResponseDto {
    return {
      id: tour.id,
      name: tour.name,
      imageUrl: tour.imageUrl,
      imagePublicId: tour.imagePublicId,
      price: Number(tour.price),
      duration: tour.duration,
      rating: Number(tour.rating),
      reviewsCount: tour.reviewsCount,
      hasVat: tour.hasVat,
      departureFrom: tour.departureFrom,
      transport: tour.transport,
      included: tour.included,
      notIncluded: tour.notIncluded,
      notes: tour.notes,
      schedules: tour.schedules,
    };
  }
}
