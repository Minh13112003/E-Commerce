import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';
import { CreateNewsDto } from './dto/create-news.dto';
import { NewsResponseDto } from './dto/news-response.dto';
import { QueryNewsDto } from './dto/query-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    return `${base}-${Date.now()}`;
  }

  private mapToDto(news: any): NewsResponseDto {
    return {
      id: news.id,
      slug: news.slug,
      title: news.title,
      excerpt: news.excerpt,
      content: news.content,
      imageUrl: news.imageUrl,
      imagePublicId: news.imagePublicId,
      category: news.category,
      isPublished: news.isPublished,
      publishedAt: news.publishedAt,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
    };
  }

  // ── Public queries ─────────────────────────────────────────────────────────

  async getAll(query: QueryNewsDto): Promise<PaginatedResponseDto<NewsResponseDto>> {
    const { page = 1, limit = 10, category } = query;
    const skip = (page - 1) * limit;

    const where: any = { isPublished: true };
    if (category) where.category = category;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.news.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.news.count({ where }),
    ]);

    return new PaginatedResponseDto(items.map((n) => this.mapToDto(n)), {
      total,
      page,
      limit,
    });
  }

  async getById(id: string): Promise<NewsResponseDto> {
    const news = await this.prisma.news.findUnique({ where: { id } });
    if (!news) throw new NotFoundException(`News with ID ${id} not found`);
    return this.mapToDto(news);
  }

  async getBySlug(slug: string): Promise<NewsResponseDto> {
    const news = await this.prisma.news.findUnique({ where: { slug } });
    if (!news) throw new NotFoundException(`News with slug "${slug}" not found`);
    return this.mapToDto(news);
  }

  // ── Admin mutations ────────────────────────────────────────────────────────

  async create(
    dto: CreateNewsDto,
    image: Express.Multer.File,
  ): Promise<NewsResponseDto> {
    if (!image) throw new BadRequestException('Ảnh bìa bài viết là bắt buộc');

    const { imageURL, imagePublicId } = await this.cloudinaryService
      .uploadImage(image, 'news')
      .catch(() => {
        throw new BadRequestException('Lỗi upload ảnh lên Cloudinary');
      });

    const slug = dto.slug ?? this.generateSlug(dto.title);

    const news = await this.prisma.news.create({
      data: {
        slug,
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
        imageUrl: imageURL,
        imagePublicId,
        category: dto.category ?? 'COMPANY',
        isPublished: dto.isPublished ?? true,
      },
    });

    return this.mapToDto(news);
  }

  async update(
    id: string,
    dto: UpdateNewsDto,
    image?: Express.Multer.File,
  ): Promise<NewsResponseDto> {
    const existing = await this.prisma.news.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`News with ID ${id} not found`);

    let imageUrl = existing.imageUrl;
    let imagePublicId = existing.imagePublicId;

    if (image) {
      await this.cloudinaryService.deleteImage(existing.imagePublicId);
      const uploaded = await this.cloudinaryService
        .uploadImage(image, 'news')
        .catch(() => {
          throw new BadRequestException('Lỗi upload ảnh mới');
        });
      imageUrl = uploaded.imageURL;
      imagePublicId = uploaded.imagePublicId;
    }

    const updated = await this.prisma.news.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.excerpt && { excerpt: dto.excerpt }),
        ...(dto.content && { content: dto.content }),
        ...(dto.category && { category: dto.category }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
        imageUrl,
        imagePublicId,
      },
    });

    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.news.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`News with ID ${id} not found`);

    await this.cloudinaryService.deleteImage(existing.imagePublicId);
    await this.prisma.news.delete({ where: { id } });

    return { success: true, message: 'Xóa bài viết thành công' };
  }

  async uploadNewsImage(file: Express.Multer.File): Promise<{ url: string }> {
    const { imageURL } = await this.cloudinaryService
      .uploadImage(file, 'news/content')
      .catch(() => {
        throw new BadRequestException('Lỗi upload ảnh lên Cloudinary');
      });
    return { url: imageURL };
  }
}
