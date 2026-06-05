import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RoleGuard } from '../../common/guard/role.guard';
import { BookingsService } from './bookings.service';
import { RelaxedThrottler } from '../../common/decorators/custom-throttler.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { BookingResponseDto, DashboardOverviewResponseDto } from './dtos/booking-response.dto';
import { CreateBookingDTO } from './dtos/create-booking.dto';
import { UpdateBookingDTO } from './dtos/update-booking.dto';
import { PaginationQueryDto } from '@/common/dtos/pagination.dto';
import { PaginatedResponseDto } from '@/common/dtos/pagination-response.dto';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth('JWT-Auth')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('dashboard')
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Get dashboard overview for the current user',
    description: 'Get total booked tours, reward points, and a list of recent bookings.',
  })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully.', type: DashboardOverviewResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async getDashboard(@GetUser('id') userId: string): Promise<DashboardOverviewResponseDto> {
    return this.bookingsService.getDashboard(userId);
  }

  @Get('me')
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Get all bookings for the current user',
    description: 'Retrieve a list of all booked tours from before to now.',
  })
  @ApiPaginatedResponse(BookingResponseDto)
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async getMyBookings(
    @GetUser('id') userId: string,
    @Query() paginationDTO: PaginationQueryDto
  ): Promise<PaginatedResponseDto<BookingResponseDto>> {
    return this.bookingsService.getAllBookingsByUserId(userId, paginationDTO);
  }

  @Get('history')
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Get transaction history for the current user',
    description: 'Retrieve a list of all booked tours from before to now.',
  })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved successfully.', type: [BookingResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async getHistory(@GetUser('id') userId: string): Promise<BookingResponseDto[]> {
    return this.bookingsService.getHistory(userId);
  }

  @Post()
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Create a new booking',
    description: 'Create a new tour booking for the current user.',
  })
  @ApiResponse({ status: 201, description: 'Booking created successfully.', type: BookingResponseDto })
  @ApiBadRequestResponse({ description: 'Bad Request. Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async createBooking(
    @Body() dto: CreateBookingDTO,
    @GetUser('id') userId: string,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.createBooking(dto, userId);
  }

  @Get(':id')
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Get booking details by ID',
    description: 'Retrieve details of a specific booking owned by the current user.',
  })
  @ApiResponse({ status: 200, description: 'Booking data retrieved successfully.', type: BookingResponseDto })
  @ApiNotFoundResponse({ description: 'Booking not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async getBookingById(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.getBookingById(id, userId);
  }

  @Patch(':id')
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Update an existing booking',
    description: 'Update the details of a booking owned by the current user.',
  })
  @ApiResponse({ status: 200, description: 'Booking updated successfully.', type: BookingResponseDto })
  @ApiNotFoundResponse({ description: 'Booking not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async updateBooking(
    @Param('id') id: string,
    @Body() dto: UpdateBookingDTO,
    @GetUser('id') userId: string,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.updateBooking(id, dto, userId);
  }

  @Delete(':id')
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Delete a booking',
    description: 'Delete a booking owned by the current user.',
  })
  @ApiResponse({ status: 200, description: 'Booking deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Booking not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async deleteBooking(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.bookingsService.deleteBooking(id, userId);
  }
}
