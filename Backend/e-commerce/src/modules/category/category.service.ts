import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDTO } from './dtos/create-category.dto';
import { CategoryResponseDTO } from './dtos/category-response.dto';
import slugify from 'slugify';
import { Category } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';
import { NotFoundError } from 'rxjs';
import { UpdateCategoryDTO } from './dtos/update-category.dto';
import { SlugifyHelper } from '../../common/helpers/slugify.helper';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async createCategory(
  createCategoryDTO: CreateCategoryDTO,
  image: Express.Multer.File | undefined   // ← Nên định nghĩa rõ kiểu
): Promise<CategoryResponseDTO> {

  // Validation cơ bản
  if (!createCategoryDTO?.name) {
    throw new BadRequestException('Category name is required');
  }

  let uploadedImage: { imageURL: string; imagePublicId: string } | null = null;

  // Upload ảnh nếu có
  if (image) {
    try {
      uploadedImage = await this.cloudinaryService.uploadImage(image, 'categories');
    } catch (error) {
      throw new BadRequestException('Failed to upload image');
    }
  }

  const slugCategory = await SlugifyHelper.slugify(createCategoryDTO.name);

  // Kiểm tra slug tồn tại
  const existingCategory = await this.prismaService.category.findUnique({
    where: { slug: slugCategory },
  });

  if (existingCategory) {
    throw new BadRequestException(`Category with slug "${slugCategory}" already exists`);
  }
  const newCategory = await this.prismaService.category.create({
    data: {
      name: createCategoryDTO.name,
      slug: slugCategory,
      description: createCategoryDTO.description,
      imageUrl: uploadedImage?.imageURL || null,
      imagePublicId: uploadedImage?.imagePublicId || null,
      isActive: createCategoryDTO.isActive ?? true, // default true nếu không truyền
    },
  });

  return this.formatCategoryResponse(newCategory, 0);
}

  async getAllCategories(
    paginationQueryDto: PaginationQueryDto
  ): Promise<PaginatedResponseDto<CategoryResponseDTO>> {
    const { page, limit } = paginationQueryDto;
    const skip = (page - 1) * limit;

    const [categories, total] = await this.prismaService.$transaction([
      this.prismaService.category.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.category.count(),
    ]);

    return new PaginatedResponseDto<CategoryResponseDTO>(
      categories.map(category => this.formatCategoryResponse(category, 0)), // giả sử productCount là 0 tạm thời
      { page, limit, total }
    );
  }

  async getCategoryById(id: string): Promise<CategoryResponseDTO> {
    const category = await this.prismaService.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        }, // Đếm số lượng sản phẩm trong category
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.formatCategoryResponse(category, Number(category._count?.products || 0));
  }

  async getCategoryBySearchTerm(
    searchTerm: string,
    paginationQueryDto: PaginationQueryDto
  ): Promise<PaginatedResponseDto<CategoryResponseDTO>> {
    const { page, limit } = paginationQueryDto;
    const skip = (page - 1) * limit;

    const [categories, total] = await this.prismaService.$transaction([
      this.prismaService.category.findMany({
        skip,
        take: limit,
        where: {
          OR: [{ name: { contains: searchTerm } }, { slug: { contains: searchTerm } }],
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          }, // Đếm số lượng sản phẩm trong category
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.category.count({
        where: {
          OR: [{ name: { contains: searchTerm } }, { slug: { contains: searchTerm } }],
        },
      }),
    ]);

    return new PaginatedResponseDto<CategoryResponseDTO>(
      categories.map(category =>
        this.formatCategoryResponse(category, Number(category._count?.products || 0))
      ),
      { page, limit, total }
    );
  }

  async getCategoryBy(slug: string): Promise<CategoryResponseDTO> {
    const category = await this.prismaService.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            products: true,
          },
        }, // Đếm số lượng sản phẩm trong category
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.formatCategoryResponse(category, Number(category._count?.products || 0));
  }

  async updateCategory(
    id: string,
    image: Express.Multer.File,
    updateCategoryDTO: UpdateCategoryDTO
  ): Promise<CategoryResponseDTO> {
    const existingCategory = await this.prismaService.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    if (!updateCategoryDTO.name) {
      throw new BadRequestException('Category name is required for update');
    }

    if (image) {
      if (existingCategory.imagePublicId) {
        await this.cloudinaryService.deleteImage(existingCategory.imagePublicId);
      }

      const uploadedImage = await this.cloudinaryService.uploadImage(image, 'categories');
      existingCategory.imageUrl = uploadedImage.imageURL;
      existingCategory.imagePublicId = uploadedImage.imagePublicId;
    }

    if (
      (await SlugifyHelper.slugify(updateCategoryDTO.name)) &&
      (await SlugifyHelper.slugify(updateCategoryDTO.name)) !==
        (await SlugifyHelper.slugify(existingCategory.name))
    ) {
      const slugCategory = await SlugifyHelper.slugify(updateCategoryDTO.name);
      const existingCategoryWithSlug = await this.prismaService.category.findUnique({
        where: { slug: slugCategory },
      });

      if (existingCategoryWithSlug) {
        throw new Error('Category with this slug already exists: ' + slugCategory);
      }
    }

    const updatedCategory = await this.prismaService.category.update({
      where: { id },
      data: {
        name: updateCategoryDTO.name,
        slug: await SlugifyHelper.slugify(updateCategoryDTO.name),
        description: updateCategoryDTO.description,
        imageUrl: existingCategory.imageUrl,
        imagePublicId: existingCategory.imagePublicId,
        isActive: updateCategoryDTO.isActive,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        }, // Đếm số lượng sản phẩm trong category
      },
    });

    return this.formatCategoryResponse(
      updatedCategory,
      Number(updatedCategory._count?.products || 0)
    );
  }

  async deleteCategory(id: string): Promise<{ message: string }> {
    const existingCategory = await this.prismaService.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        }, // Đếm số lượng sản phẩm trong category
      },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    if (existingCategory._count?.products && existingCategory._count.products > 0) {
      throw new BadRequestException(
        `Cannot delete category ${existingCategory.name} with associated products`
      );
    }

    await this.prismaService.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully.' };
  }

  private formatCategoryResponse(category: Category, productCount: number): CategoryResponseDTO {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageURL: category.imageUrl,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      imagePublicId: category.imagePublicId,
      productCount,
    };
  }
}
