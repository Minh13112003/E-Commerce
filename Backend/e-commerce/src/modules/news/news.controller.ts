import {
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
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ImageInterceptor } from '../../common/cloudinary/multer-image.interceptor';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { RelaxedThrottler } from '../../common/decorators/custom-throttler.decorator';
import { Roles } from '../../common/decorators/role.decorator';
import { SwaggerImageUpload } from '../../common/decorators/swagger-file.decorator';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RoleGuard } from '../../common/guard/role.guard';
import { CreateNewsDto } from './dto/create-news.dto';
import { NewsResponseDto } from './dto/news-response.dto';
import { QueryNewsDto } from './dto/query-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsService } from './news.service';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  // ── Public endpoints ───────────────────────────────────────────────────────

  @Get()
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Lấy danh sách tin tức (có phân trang)',
    description: 'Trả về các bài viết đã publish, sắp xếp theo ngày mới nhất. Lọc theo category tuỳ chọn.',
  })
  @ApiPaginatedResponse(NewsResponseDto)
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async getAll(
    @Query() query: QueryNewsDto,
  ): Promise<PaginatedResponseDto<NewsResponseDto>> {
    return this.newsService.getAll(query);
  }

  @Get(':id')
  @RelaxedThrottler()
  @ApiOperation({ summary: 'Lấy chi tiết bài viết theo ID' })
  @ApiResponse({ status: 200, type: NewsResponseDto })
  @ApiNotFoundResponse({ description: 'Bài viết không tồn tại.' })
  async getById(@Param('id') id: string): Promise<NewsResponseDto> {
    return this.newsService.getById(id);
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @SwaggerImageUpload(CreateNewsDto, 'image', true)
  @UseInterceptors(ImageInterceptor('image'))
  @ApiOperation({ summary: '[Admin] Tạo bài tin tức mới (kèm ảnh bìa)' })
  @ApiResponse({ status: 201, type: NewsResponseDto })
  async create(
    @Body() dto: CreateNewsDto,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<NewsResponseDto> {
    return this.newsService.create(dto, image);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @SwaggerImageUpload(UpdateNewsDto, 'image', false)
  @UseInterceptors(ImageInterceptor('image'))
  @ApiOperation({ summary: '[Admin] Cập nhật bài tin tức' })
  @ApiResponse({ status: 200, type: NewsResponseDto })
  @ApiNotFoundResponse({ description: 'Bài viết không tồn tại.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNewsDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<NewsResponseDto> {
    return this.newsService.update(id, dto, image);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: '[Admin] Xóa bài tin tức' })
  @ApiResponse({ status: 200, description: 'Xóa thành công.' })
  @ApiNotFoundResponse({ description: 'Bài viết không tồn tại.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  async remove(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.newsService.remove(id);
  }
}
