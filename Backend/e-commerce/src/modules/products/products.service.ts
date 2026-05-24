import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SlugifyHelper } from '../../common/helpers/slugify.helper';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductResponseDTO } from './dtos/product-response.dtos';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';
import { CreateProductDTO } from './dtos/create-product.dto';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { UpdateProductDTO } from './dtos/update-product.dto';
import { QueryProductDTO } from './dtos/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async getProductsByCategorySlug(
    categorySlug: string,
    paginationQueryDto: PaginationQueryDto
  ): Promise<PaginatedResponseDto<ProductResponseDTO>> {
    const slugcategory = await SlugifyHelper.slugify(categorySlug);
    const { page, limit } = paginationQueryDto;
    const skip = (page - 1) * limit;

    const [products, total] = await this.prismaService.$transaction([
      this.prismaService.product.findMany({
        where: {
          isActive: true,
          productCategories: {
            some: {
              category: {
                slug: slugcategory,
                isActive: true,
              },
            },
          },
        },
        include: {
          primaryCategory: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          productCategories: {
            include: {
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.product.count({
        where: {
          isActive: true,
          productCategories: {
            some: {
              category: {
                slug: slugcategory,
                isActive: true,
              },
            },
          },
        },
      }),
    ]);

    return new PaginatedResponseDto<ProductResponseDTO>(
      products.map(product => this.formatProductResponse(product, total)),
      { page, limit, total }
    );
  }

  async getAllProducts(
    queryDto: QueryProductDTO
  ): Promise<PaginatedResponseDto<ProductResponseDTO>> {
    const { page = 1, limit = 36, categoryName, isActive, search } = queryDto;

    const skip = (page - 1) * limit;

    const where: any = {};

    // ==================== FILTER ====================

    // Search theo tên sản phẩm
    if (search?.trim()) {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    // Filter theo categoryName
    if (categoryName?.trim()) {
      where.productCategories = {
        some: {
          category: {
            name: {
              equals: categoryName.trim(),
              mode: 'insensitive',
            },
            // isActive: true,   // bạn có thể bỏ hoặc giữ tùy business
          },
        },
      };
    }

    // Filter theo isActive - CHỈ filter khi người dùng TRUYỀN GIÁ TRỊ
    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }
    // Không có else → nghĩa là lấy cả active lẫn inactive

    // ==================== QUERY ====================
    const [products, total] = await this.prismaService.$transaction([
      this.prismaService.product.findMany({
        where,
        include: {
          primaryCategory: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          productCategories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
            orderBy: { position: 'asc' },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),

      this.prismaService.product.count({ where }),
    ]);

    return new PaginatedResponseDto<ProductResponseDTO>(
      products.map(product => this.formatProductResponse(product, total)),
      { page, limit, total }
    );
  }

  async getProductById(id: string): Promise<ProductResponseDTO> {
    const product = await this.prismaService.product.findUnique({
      where: { id },
      include: {
        primaryCategory: true,
        productCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      throw new BadRequestException('Product not found');
    }

    return this.formatProductResponse(product, 1);
  }

  async createProduct(
    createProductDto: CreateProductDTO,
    image: Express.Multer.File | undefined
  ): Promise<ProductResponseDTO> {
    const existingSku = await this.prismaService.product.findUnique({
      where: { sku: createProductDto.sku },
    });

    if (existingSku) {
      throw new BadRequestException('Product with this SKU already exists.');
    }

    let { categoryNames, ...productData } = createProductDto;
    let uploadImage: { imageURL: string; imagePublicId: string } | null = null;

    if (image) {
      try {
        uploadImage = await this.cloudinaryService.uploadImage(image, 'products');
      } catch (error: any) {
        throw new BadRequestException('Image upload failed: ' + error?.message);
      }
    }

    if (!categoryNames || categoryNames.length === 0) {
      throw new BadRequestException('At least one category is required');
    }
    if (categoryNames && !Array.isArray(categoryNames)) {
      categoryNames = [categoryNames];
    }

    if (!categoryNames || categoryNames.length === 0) {
      throw new BadRequestException('At least one category is required');
    }

    const categoriesData = await Promise.all(
      categoryNames.map(async name => ({
        where: { slug: await SlugifyHelper.slugify(name) }, // slug là unique
        create: {
          name,
          slug: await SlugifyHelper.slugify(name),
          description: 'Description example for ' + name,
          isActive: true,
        },
      }))
    );

    const product = await this.prismaService.product.create({
      data: {
        ...productData,
        imageURL: uploadImage?.imageURL || null,
        imagePublicId: uploadImage?.imagePublicId || null,
        price: parseFloat(productData.price.toString()),

        primaryCategory: {
          connectOrCreate: categoriesData[0], // Kết nối hoặc tạo category đầu tiên làm primary
        },

        // Quan trọng: đi qua bảng trung gian
        productCategories: {
          create: categoriesData.map((cat, index) => ({
            position: index,
            category: {
              connectOrCreate: cat,
            },
          })),
        },
      },
      include: {
        primaryCategory: true,
        productCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    return this.formatProductResponse(product, 0);
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDTO,
    image: Express.Multer.File | undefined
  ): Promise<ProductResponseDTO> {
    const existingProduct = await this.prismaService.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new BadRequestException('Product not found');
    }

    if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
      const existingSku = await this.prismaService.product.findUnique({
        where: { sku: updateProductDto.sku },
      });
      if (existingSku) {
        throw new BadRequestException('Product with this SKU already exists.');
      }
    }

    const { categoryNames, primaryCategoryName, ...productData } = updateProductDto;

    let uploadImage: { imageURL: string; imagePublicId: string } | null = null;

    if (image) {
      try {
        if (existingProduct.imagePublicId) {
          await this.cloudinaryService.deleteImage(existingProduct.imagePublicId);
        }
        const newImage = await this.cloudinaryService.uploadImage(image, 'products');
        uploadImage = newImage;
      } catch (error: any) {
        throw new BadRequestException('Image upload failed: ' + error?.message);
      }
    }

    return await this.prismaService.$transaction(async tx => {
      let categoriesData: any[] = [];
      let primaryCategorySlug: string | null = null;

      // Xử lý categoryNames
      if (categoryNames && categoryNames.length > 0) {
        categoriesData = await Promise.all(
          categoryNames.map(async name => {
            const slug = await SlugifyHelper.slugify(name);
            return {
              where: { slug },
              create: {
                name,
                slug,
                description: `Description for ${name}`,
                isActive: true,
              },
            };
          })
        );

        // Mặc định primary là category đầu tiên
        primaryCategorySlug = categoriesData[0].where.slug;
      }

      if (updateProductDto.primaryCategoryName) {
        const primarySlug = await SlugifyHelper.slugify(updateProductDto.primaryCategoryName);
        primaryCategorySlug = primarySlug;

        // Đảm bảo primary category nằm trong danh sách (nếu có categoryNames)
        if (categoriesData.length > 0) {
          const exists = categoriesData.some(cat => cat.where.slug === primarySlug);
          if (!exists) {
            // Thêm primary vào danh sách nếu chưa có
            categoriesData.unshift({
              where: { slug: primarySlug },
              create: {
                name: updateProductDto.primaryCategoryName,
                slug: primarySlug,
                description: `Description for ${updateProductDto.primaryCategoryName}`,
                isActive: true,
              },
            });
          }
        }
      }

      // ==================== UPDATE PRODUCT ====================
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          ...productData,
          ...(productData.price && {
            price: parseFloat(productData.price.toString()),
          }),
          ...(uploadImage && {
            imageURL: uploadImage.imageURL,
            imagePublicId: uploadImage.imagePublicId,
          }),

          // Primary Category
          ...(primaryCategorySlug && {
            primaryCategory: {
              connectOrCreate: {
                where: { slug: primaryCategorySlug },
                create: {
                  name:
                    updateProductDto.primaryCategoryName || categoryNames?.[0] || 'Uncategorized',
                  slug: primaryCategorySlug,
                  description: 'Auto created category',
                  isActive: true,
                },
              },
            },
          }),
        },
        include: {
          primaryCategory: true,
          productCategories: {
            include: { category: true },
            orderBy: { position: 'asc' },
          },
        },
      });

      // ==================== XỬ LÝ MANY-TO-MANY (ProductCategory) ====================
      if (categoriesData.length > 0) {
        // Xóa hết relation cũ
        await tx.productCategory.deleteMany({
          where: { productId: id },
        });

        // Upsert tất cả categories và lấy ID
        const categoryIds = await Promise.all(
          categoriesData.map(async catData => {
            const category = await tx.category.upsert({
              where: { slug: catData.where.slug },
              update: {},
              create: catData.create,
            });
            return category.id;
          })
        );

        // Tạo relation mới
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId, index) => ({
            productId: id,
            categoryId,
            position: index,
          })),
          skipDuplicates: true,
        });
      }

      return this.formatProductResponse(updatedProduct, 0);
    });
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    const existingProduct = await this.prismaService.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    // Bắt đầu transaction
    await this.prismaService.$transaction(async tx => {
      // 1. Xóa ảnh trên Cloudinary (nếu có)
      if (existingProduct.imagePublicId) {
        try {
          await this.cloudinaryService.deleteImage(existingProduct.imagePublicId);
        } catch (error: any) {
          console.error(`Failed to delete image ${existingProduct.imagePublicId}:`, error?.message);
          // Không throw lỗi → vẫn cho phép xóa sản phẩm
        }
      }

      // 2. Xóa Product (Prisma sẽ tự cascade xóa ProductCategory)
      await tx.product.delete({
        where: { id },
      });
    });

    return { message: 'Product deleted successfully' };
  }

  private formatProductResponse(product: any, categoryProductCount: number): ProductResponseDTO {
    const categoryNames = product.productCategories
      ? product.productCategories.map((pc: any) => pc.category?.name).filter(Boolean)
      : [];
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price), // Decimal → number
      stock: product.stock,
      sku: product.sku,
      imageURL: product.imageURL,
      imagePublicId: product.imagePublicId,
      isActive: product.isActive,
      categoryNames,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,

      // Primary Category
      primaryCategoryId: product.primaryCategory?.id || null,
      primaryCategoryName: product.primaryCategory?.name || null,

      // Tổng số sản phẩm trong danh mục hiện tại
      categoryProductCount: categoryProductCount,
    };
  }
}
