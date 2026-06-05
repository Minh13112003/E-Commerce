import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RoleGuard } from '../../common/guard/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { ToursService } from './tours.service';
import { RelaxedThrottler } from '../../common/decorators/custom-throttler.decorator';
import { TourResponseDto } from './dtos/tour-response.dto';
import { CreateTourDTO } from './dtos/create-tour.dto';
import { UpdateTourDTO } from './dtos/update-tour.dto';
import { RateTourDTO } from './dtos/rate-tour.dto';
import { SwaggerImageUpload, UploadImages } from '../../common/decorators/swagger-file.decorator';
import { ImageInterceptor } from '../../common/cloudinary/multer-image.interceptor';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';

@ApiTags('Tours')
@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Get()
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Get all tours',
    description: 'Retrieve a list of all available tours.',
  })
  @ApiPaginatedResponse(TourResponseDto)
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async getAllTours(@Query() paginationDTO: PaginationQueryDto): Promise<PaginatedResponseDto<TourResponseDto>> {
    return this.toursService.getAllTours(paginationDTO);
  }

  @Get(':id')
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Get specific tour by ID',
    description: 'Retrieve detailed information of a specific tour.',
  })
  @ApiResponse({ status: 200, description: 'Tour data retrieved successfully.', type: TourResponseDto })
  @ApiNotFoundResponse({ description: 'Tour not found.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async getTourById(@Param('id') id: string): Promise<TourResponseDto> {
    return this.toursService.getTourById(id);
  }

  @Post('bulk')
  @RelaxedThrottler()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @UploadImages('images') // Sử dụng decorator số nhiều nhận mảng ảnh
  @ApiOperation({
    summary: 'Tạo hàng loạt nhiều tour cùng lúc (Chỉ Admin)',
    description: 'Truyền chuỗi JSON mảng các tour vào trường "tours" và chọn nhiều file ảnh tương ứng vào trường "images".',
  })
  @ApiResponse({ status: 201, description: 'Tạo loạt tour thành công.', type: [TourResponseDto] })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ hoặc thiếu file.' })
  async createBulkTours(
    @Body('tours') toursDataString: string,
    @UploadedFiles() images: Express.Multer.File[],
  ): Promise<TourResponseDto[]> {
    return this.toursService.createBulkTours(toursDataString, images);
  }

  @Patch(':id')
  @RelaxedThrottler()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @SwaggerImageUpload(UpdateTourDTO, 'image', false)
  @UseInterceptors(ImageInterceptor('image'))
  @ApiOperation({
    summary: 'Update an existing tour (Admin only)',
    description: 'Update tour details with an optional new image.',
  })
  @ApiResponse({ status: 200, description: 'Tour updated successfully.', type: TourResponseDto })
  @ApiNotFoundResponse({ description: 'Tour not found.' })
  @ApiBadRequestResponse({ description: 'Bad Request. Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async updateTour(
    @Param('id') id: string,
    @Body() dto: UpdateTourDTO,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<TourResponseDto> {
    return this.toursService.updateTour(id, dto, image);
  }

  @Delete(':id')
  @RelaxedThrottler()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Delete a tour (Admin only)',
    description: 'Delete a tour listing by ID.',
  })
  @ApiResponse({ status: 200, description: 'Tour deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Tour not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async deleteTour(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.toursService.deleteTour(id);
  }

  @Post(':id/rate')
  @RelaxedThrottler()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Rate a tour',
    description: 'Submit a rating score for the tour which updates its average rating and reviews count.',
  })
  @ApiResponse({ status: 200, description: 'Tour rated successfully.', type: TourResponseDto })
  @ApiNotFoundResponse({ description: 'Tour not found.' })
  @ApiBadRequestResponse({ description: 'Bad Request. Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async rateTour(
    @Param('id') id: string,
    @Body() dto: RateTourDTO,
  ): Promise<TourResponseDto> {
    return this.toursService.rateTour(id, dto.rating);
  }
}
