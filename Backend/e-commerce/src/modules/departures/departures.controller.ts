import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeparturesService } from './departures.service';
import { CreateDepartureDto } from './dtos/create-departure.dto';
import { UpdateDepartureDto } from './dtos/update-departure.dto';
import { DepartureResponseDto } from './dtos/departure-response.dto';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RoleGuard } from '../../common/guard/role.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';
import { RelaxedThrottler } from '../../common/decorators/custom-throttler.decorator';

@ApiTags('Departures')
@Controller('departures')
export class DeparturesController {
  constructor(private readonly departuresService: DeparturesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Create a new departure (Admin only)' })
  @ApiResponse({ status: 201, type: DepartureResponseDto })
  async create(@Body() dto: CreateDepartureDto): Promise<DepartureResponseDto> {
    return this.departuresService.create(dto);
  }

  @Get()
  @RelaxedThrottler()
  @ApiOperation({ summary: 'Get all departures (paginated)' })
  @ApiResponse({ status: 200 })
  async findAll(@Query() pagination: PaginationQueryDto): Promise<PaginatedResponseDto<DepartureResponseDto>> {
    return this.departuresService.findAll(pagination);
  }

  @Get('tour/:tourId')
  @RelaxedThrottler()
  @ApiOperation({ summary: 'Get all departures for a tour' })
  @ApiResponse({ status: 200, type: [DepartureResponseDto] })
  async findByTour(@Param('tourId') tourId: string): Promise<DepartureResponseDto[]> {
    return this.departuresService.findByTourId(tourId);
  }

  @Get(':id')
  @RelaxedThrottler()
  @ApiOperation({ summary: 'Get departure by ID' })
  @ApiResponse({ status: 200, type: DepartureResponseDto })
  async findOne(@Param('id') id: string): Promise<DepartureResponseDto> {
    return this.departuresService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Update departure (Admin only)' })
  @ApiResponse({ status: 200, type: DepartureResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateDepartureDto): Promise<DepartureResponseDto> {
    return this.departuresService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Delete departure (Admin only)' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.departuresService.remove(id);
  }
}
