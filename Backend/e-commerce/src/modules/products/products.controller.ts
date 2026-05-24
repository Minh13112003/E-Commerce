import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Body,
  UseInterceptors,
  UploadedFile,
  Patch,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';
import { ProductResponseDTO } from './dtos/product-response.dtos';
import { Product, Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RoleGuard } from '../../common/guard/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { CreateProductDTO } from './dtos/create-product.dto';
import { SwaggerImageUpload } from '../../common/decorators/swagger-file.decorator';
import { ImageInterceptor } from '../../common/cloudinary/multer-image.interceptor';
import { UpdateProductDTO } from './dtos/update-product.dto';
import { QueryProductDTO } from './dtos/query-product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all products',
    description: 'Retrieve a list of all products.',
  })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error. Failed to retrieve products.' })
  async getAllProducts(
    @Query() queryDto: QueryProductDTO
  ): Promise<PaginatedResponseDto<ProductResponseDTO>> {
    return this.productService.getAllProducts(queryDto);
  }

  @Get('category/:categorySlug')
  @ApiOperation({
    summary: 'Get all products by category slug',
    description:
      'Retrieve a list of products that belong to a specific category identified by its slug.',
  })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. Failed to retrieve products.',
  })
  async getAllProductsByCategorySlug(
    @Param('categorySlug') categorySlug: string,
    @Query() paginationQueryDto: PaginationQueryDto
  ): Promise<PaginatedResponseDto<ProductResponseDTO>> {
    return this.productService.getProductsByCategorySlug(categorySlug, paginationQueryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a product by ID',
    description: 'Retrieve the details of a specific product identified by its ID.',
  })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. Failed to retrieve product.',
  })
  async getProductById(@Param('id') id: string): Promise<ProductResponseDTO> {
    return this.productService.getProductById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Create a new product with the provided details.',
  })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @SwaggerImageUpload(CreateProductDTO, 'image')
  @UseInterceptors(ImageInterceptor('image'))
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error. Failed to create product.' })
  @ApiResponse({ status: 429, description: 'Too Many Requests. Please try again later.' })
  async createProduct(
    @Body() createProductDto: CreateProductDTO,
    @UploadedFile() image: Express.Multer.File
  ): Promise<ProductResponseDTO> {
    // Implementation for creating a new product goes here
    return this.productService.createProduct(createProductDto, image);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing product',
    description: 'Update the details of an existing product identified by its ID.',
  })
  @ApiExtraModels(UpdateProductDTO)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @SwaggerImageUpload(UpdateProductDTO, 'image')
  @UseInterceptors(ImageInterceptor('image'))
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error. Failed to update product.' })
  @ApiResponse({ status: 429, description: 'Too Many Requests. Please try again later.' })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDTO,
    @UploadedFile() image: Express.Multer.File
  ): Promise<ProductResponseDTO> {
    // Implementation for updating an existing product goes here
    return this.productService.updateProduct(id, updateProductDto, image);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a product',
    description: 'Delete an existing product identified by its ID.',
  })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error. Failed to delete product.' })
  @ApiResponse({ status: 429, description: 'Too Many Requests. Please try again later.' })
  async deleteProduct(@Param('id') id: string): Promise<{ message: string }> {
    // Implementation for deleting a product goes here
    return await this.productService.deleteProduct(id);
  }
}
