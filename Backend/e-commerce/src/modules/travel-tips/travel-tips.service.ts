import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';
import { CreateTravelTipDto } from './dto/create-travel-tip.dto';
import { QueryTravelTipDto } from './dto/query-travel-tip.dto';
import { TravelTipResponseDto } from './dto/travel-tip-response.dto';
import { UpdateTravelTipDto } from './dto/update-travel-tip.dto';

@Injectable()
export class TravelTipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private mapToDto(tip: any): TravelTipResponseDto {
    return {
      id: tip.id,
      title: tip.title,
      excerpt: tip.excerpt,
      content: tip.content,
      imageUrl: tip.imageUrl,
      imagePublicId: tip.imagePublicId,
      destination: tip.destination ?? null,
      tags: tip.tags,
      relatedSearchQuery: tip.relatedSearchQuery ?? null,
      isPublished: tip.isPublished,
      publishedAt: tip.publishedAt,
      createdAt: tip.createdAt,
      updatedAt: tip.updatedAt,
    };
  }

  // ── Public queries ─────────────────────────────────────────────────────────

  async getAll(
    query: QueryTravelTipDto,
  ): Promise<PaginatedResponseDto<TravelTipResponseDto>> {
    const { page = 1, limit = 10, destination } = query;
    const skip = (page - 1) * limit;

    const where: any = { isPublished: true };
    if (destination) {
      where.destination = { contains: destination, mode: 'insensitive' };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.travelTip.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.travelTip.count({ where }),
    ]);

    return new PaginatedResponseDto(items.map((t) => this.mapToDto(t)), {
      total,
      page,
      limit,
    });
  }

  async getById(id: string): Promise<TravelTipResponseDto> {
    const tip = await this.prisma.travelTip.findUnique({ where: { id } });
    if (!tip) throw new NotFoundException(`Travel tip with ID ${id} not found`);
    return this.mapToDto(tip);
  }

  /** Lấy danh sách điểm đến có ít nhất 1 tip đã publish */
  async getDestinations(): Promise<string[]> {
    const rows = await this.prisma.travelTip.findMany({
      where: { isPublished: true, NOT: { destination: null } },
      select: { destination: true },
      distinct: ['destination'],
      orderBy: { destination: 'asc' },
    });
    return rows.map((r) => r.destination).filter((d): d is string => d !== null);
  }

  // ── Admin mutations ────────────────────────────────────────────────────────

  async create(
    dto: CreateTravelTipDto,
    image: Express.Multer.File,
  ): Promise<TravelTipResponseDto> {
    if (!image) throw new BadRequestException('Ảnh bìa bài viết là bắt buộc');

    const { imageURL, imagePublicId } = await this.cloudinaryService
      .uploadImage(image, 'travel-tips')
      .catch(() => {
        throw new BadRequestException('Lỗi upload ảnh lên Cloudinary');
      });

    const tip = await this.prisma.travelTip.create({
      data: {
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
        imageUrl: imageURL,
        imagePublicId,
        destination: dto.destination ?? null,
        tags: dto.tags ?? [],
        relatedSearchQuery: dto.relatedSearchQuery ?? null,
        isPublished: dto.isPublished ?? true,
      },
    });

    return this.mapToDto(tip);
  }

  async update(
    id: string,
    dto: UpdateTravelTipDto,
    image?: Express.Multer.File,
  ): Promise<TravelTipResponseDto> {
    const existing = await this.prisma.travelTip.findUnique({ where: { id } });
    if (!existing)
      throw new NotFoundException(`Travel tip with ID ${id} not found`);

    let imageUrl = existing.imageUrl;
    let imagePublicId = existing.imagePublicId;

    if (image) {
      await this.cloudinaryService.deleteImage(existing.imagePublicId);
      const uploaded = await this.cloudinaryService
        .uploadImage(image, 'travel-tips')
        .catch(() => {
          throw new BadRequestException('Lỗi upload ảnh mới');
        });
      imageUrl = uploaded.imageURL;
      imagePublicId = uploaded.imagePublicId;
    }

    const updated = await this.prisma.travelTip.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.excerpt && { excerpt: dto.excerpt }),
        ...(dto.content && { content: dto.content }),
        ...(dto.destination !== undefined && { destination: dto.destination }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.relatedSearchQuery !== undefined && {
          relatedSearchQuery: dto.relatedSearchQuery,
        }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
        imageUrl,
        imagePublicId,
      },
    });

    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.travelTip.findUnique({ where: { id } });
    if (!existing)
      throw new NotFoundException(`Travel tip with ID ${id} not found`);

    await this.cloudinaryService.deleteImage(existing.imagePublicId);
    await this.prisma.travelTip.delete({ where: { id } });

    return { success: true, message: 'Xóa mẹo du lịch thành công' };
  }
}
