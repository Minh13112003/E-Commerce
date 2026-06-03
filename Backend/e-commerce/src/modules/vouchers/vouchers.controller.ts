import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiConflictResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RoleGuard } from '../../common/guard/role.guard';
import { VouchersService } from './vouchers.service';
import { RelaxedThrottler } from '../../common/decorators/custom-throttler.decorator';
import { VoucherResponseDto } from './dtos/voucher-response.dto';
import { CreateVoucherDTO } from './dtos/create-voucher.dto';
import { UpdateVoucherDTO } from './dtos/update-voucher.dto';

@ApiTags('Vouchers')
@Controller('vouchers')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth('JWT-Auth')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Get all active vouchers',
    description: 'Retrieve a list of all active vouchers for the current user.',
  })
  @ApiResponse({ status: 200, description: 'Vouchers list retrieved successfully.', type: [VoucherResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async getAllVouchers(): Promise<VoucherResponseDto[]> {
    return this.vouchersService.getAllVouchers();
  }

  @Get(':id')
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Get a voucher by ID',
    description: 'Retrieve details of a specific voucher.',
  })
  @ApiResponse({ status: 200, description: 'Voucher data retrieved successfully.', type: VoucherResponseDto })
  @ApiNotFoundResponse({ description: 'Voucher not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async getVoucherById(@Param('id') id: string): Promise<VoucherResponseDto> {
    return this.vouchersService.getVoucherById(id);
  }

  @Post()
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Create a new voucher',
    description: 'Create a new voucher.',
  })
  @ApiBody({ type: CreateVoucherDTO })
  @ApiResponse({ status: 201, description: 'Voucher created successfully.', type: VoucherResponseDto })
  @ApiBadRequestResponse({ description: 'Bad Request. Validation failed.' })
  @ApiConflictResponse({ description: 'Conflict. Voucher code already exists.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async createVoucher(@Body() dto: CreateVoucherDTO): Promise<VoucherResponseDto> {
    return this.vouchersService.createVoucher(dto);
  }

  @Patch(':id')
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Update an existing voucher',
    description: 'Update the details of a voucher.',
  })
  @ApiBody({ type: UpdateVoucherDTO })
  @ApiResponse({ status: 200, description: 'Voucher updated successfully.', type: VoucherResponseDto })
  @ApiNotFoundResponse({ description: 'Voucher not found.' })
  @ApiBadRequestResponse({ description: 'Bad Request. Validation failed.' })
  @ApiConflictResponse({ description: 'Conflict. Voucher code already exists.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async updateVoucher(
    @Param('id') id: string,
    @Body() dto: UpdateVoucherDTO,
  ): Promise<VoucherResponseDto> {
    return this.vouchersService.updateVoucher(id, dto);
  }

  @Delete(':id')
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Delete a voucher',
    description: 'Delete a voucher.',
  })
  @ApiResponse({ status: 200, description: 'Voucher deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Voucher not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async deleteVoucher(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.vouchersService.deleteVoucher(id);
  }
}
