import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/role.decorator';
import { RoleGuard } from '../../common/guard/role.guard';
import { CreateCategoryDTO } from './dtos/create-category.dto';
import { CategoryResponseDTO } from './dtos/category-response.dto';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';
import { CategorySearchTermDto } from './dtos/category-searchTerm.dto';
import { UpdateCategoryDTO } from './dtos/update-category.dto';
import { SwaggerImageUpload } from '../../common/decorators/swagger-file.decorator';
import { ImageInterceptor } from '../../common/cloudinary/multer-image.interceptor';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @SwaggerImageUpload(CreateCategoryDTO, 'image')
  @UseInterceptors(ImageInterceptor('image'))
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Create a new category',
    description: 'Create a new product category. Only accessible by admin users.',
  })
  @ApiResponse({ status: 200, description: 'Category created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error. Failed to create category.' })
  @ApiResponse({ status: 429, description: 'Too Many Requests. Please try again later.' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDTO, @UploadedFile() image: Express.Multer.File): Promise<CategoryResponseDTO> {
    return await this.categoryService.createCategory(createCategoryDto, image);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all categories',
    description: 'Retrieve a list of all product categories.',
  })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully.' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. Failed to retrieve categories.',
  })
  @ApiPaginatedResponse(CategoryResponseDTO)
  async getAllCategories(
    @Query() paginationQueryDto: PaginationQueryDto
  ): Promise<PaginatedResponseDto<CategoryResponseDTO>> {
    return this.categoryService.getAllCategories(paginationQueryDto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Get category by name or slug',
    description: 'Retrieve detailed information about a specific category by its name or slug.',
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully.',
    type: PaginatedResponseDto<CategoryResponseDTO>,
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. Failed to retrieve category.',
  })
  @ApiQuery({
    name: 'searchTerm',
    required: true,
    description: 'The name or slug of the category to retrieve',
  })
  @ApiPaginatedResponse(CategoryResponseDTO)
  async getCategoryBySearchTerm(
    @Query() categorySearchTermDto: CategorySearchTermDto
  ): Promise<PaginatedResponseDto<CategoryResponseDTO>> {
    if (!categorySearchTermDto.searchTerm) {
      throw new BadRequestException('Search term is required');
    }
    return await this.categoryService.getCategoryBySearchTerm(
      categorySearchTermDto.searchTerm,
      categorySearchTermDto
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Retrieve detailed information about a specific category by its ID.',
  })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. Failed to retrieve category.',
  })
  async getCategoryById(@Query('id') id: string): Promise<CategoryResponseDTO> {
    return await this.categoryService.getCategoryById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Update category by ID',
    description:
      'Update the details of a specific category by its ID. Only accessible by admin users.',
  })
  @SwaggerImageUpload(UpdateCategoryDTO, 'image')
  @UseInterceptors(ImageInterceptor('image'))
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully.',
    type: CategoryResponseDTO,
  })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Category with the same slug already exists.',
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error. Failed to update category.' })
  async updateCategory(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Body() updateCategoryDto: UpdateCategoryDTO
  ): Promise<CategoryResponseDTO> {
    return await this.categoryService.updateCategory(id, image, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Delete category by ID',
    description: 'Delete a specific category by its ID. Only accessible by admin users.',
  })
  @ApiResponse({ status: 200, description: 'Category deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error. Failed to delete category.' })
  async deleteCategory(@Param('id') id: string): Promise<{ message: string }> {
    return await this.categoryService.deleteCategory(id);
  }
}
