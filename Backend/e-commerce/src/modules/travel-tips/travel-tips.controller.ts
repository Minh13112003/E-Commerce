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
import { CreateTravelTipDto } from './dto/create-travel-tip.dto';
import { QueryTravelTipDto } from './dto/query-travel-tip.dto';
import { TravelTipResponseDto } from './dto/travel-tip-response.dto';
import { UpdateTravelTipDto } from './dto/update-travel-tip.dto';
import { TravelTipsService } from './travel-tips.service';

@ApiTags('Travel Tips')
@Controller('travel-tips')
export class TravelTipsController {
  constructor(private readonly travelTipsService: TravelTipsService) {}

  // ── Public endpoints ───────────────────────────────────────────────────────

  @Get()
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Lấy danh sách mẹo du lịch (có phân trang)',
    description: 'Trả về các tip đã publish. Lọc theo điểm đến (destination) tuỳ chọn.',
  })
  @ApiPaginatedResponse(TravelTipResponseDto)
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async getAll(
    @Query() query: QueryTravelTipDto,
  ): Promise<PaginatedResponseDto<TravelTipResponseDto>> {
    return this.travelTipsService.getAll(query);
  }

  @Get('destinations')
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Lấy danh sách các điểm đến có tip',
    description: 'Dùng để render filter chips trên màn hình Mẹo du lịch.',
  })
  @ApiResponse({ status: 200, type: [String] })
  async getDestinations(): Promise<string[]> {
    return this.travelTipsService.getDestinations();
  }

  @Get(':id')
  @RelaxedThrottler()
  @ApiOperation({ summary: 'Lấy chi tiết mẹo du lịch theo ID' })
  @ApiResponse({ status: 200, type: TravelTipResponseDto })
  @ApiNotFoundResponse({ description: 'Tip không tồn tại.' })
  async getById(@Param('id') id: string): Promise<TravelTipResponseDto> {
    return this.travelTipsService.getById(id);
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @SwaggerImageUpload(CreateTravelTipDto, 'image', true)
  @UseInterceptors(ImageInterceptor('image'))
  @ApiOperation({ summary: '[Admin] Tạo mẹo du lịch mới (kèm ảnh bìa)' })
  @ApiResponse({ status: 201, type: TravelTipResponseDto })
  async create(
    @Body() dto: CreateTravelTipDto,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<TravelTipResponseDto> {
    return this.travelTipsService.create(dto, image);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @SwaggerImageUpload(UpdateTravelTipDto, 'image', false)
  @UseInterceptors(ImageInterceptor('image'))
  @ApiOperation({ summary: '[Admin] Cập nhật mẹo du lịch' })
  @ApiResponse({ status: 200, type: TravelTipResponseDto })
  @ApiNotFoundResponse({ description: 'Tip không tồn tại.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTravelTipDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<TravelTipResponseDto> {
    return this.travelTipsService.update(id, dto, image);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: '[Admin] Xóa mẹo du lịch' })
  @ApiResponse({ status: 200, description: 'Xóa thành công.' })
  @ApiNotFoundResponse({ description: 'Tip không tồn tại.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  async remove(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.travelTipsService.remove(id);
  }
}
