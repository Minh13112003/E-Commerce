import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VoucherResponseDto } from './dtos/voucher-response.dto';
import { CreateVoucherDTO } from './dtos/create-voucher.dto';
import { UpdateVoucherDTO } from './dtos/update-voucher.dto';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';
import { Role } from '@prisma/client';

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllVouchers(
    userId: string,
    role: string,
    paginationDTO: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<VoucherResponseDto>> {
    const { page, limit } = paginationDTO;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role !== Role.ADMIN) {
      where.status = true;
      where.OR = [
        { userId: null },
        { userId: userId },
      ];
    }

    const [vouchers, total] = await this.prisma.$transaction([
      this.prisma.voucher.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.voucher.count({
        where,
      }),
    ]);

    return new PaginatedResponseDto(
      vouchers.map(v => this.mapToDto(v)),
      { total, page, limit }
    );
  }

  async getVoucherById(id: string): Promise<VoucherResponseDto> {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
    });
    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }
    return this.mapToDto(voucher);
  }

  async createVoucher(
    dto: CreateVoucherDTO[],
    usercreatedId?: string,
  ): Promise<VoucherResponseDto[]> {
    if (!Array.isArray(dto) || dto.length === 0) {
      throw new BadRequestException('Voucher must be an array');
    }

    // Kiểm tra trùng code trong request
    const codes = dto.map((v) => v.code);

    if (new Set(codes).size !== codes.length) {
      throw new ConflictException('Duplicate voucher codes in request');
    }

    // Kiểm tra code đã tồn tại trong DB
    const existingVouchers = await this.prisma.voucher.findMany({
      where: {
        code: {
          in: codes,
        },
      },
    });

    if (existingVouchers.length > 0) {
      throw new ConflictException(
        `Voucher code already exists: ${existingVouchers
          .map((v) => v.code)
          .join(', ')}`,
      );
    }

    const createdVouchers = await this.prisma.$transaction(
      dto.map((voucher) =>
        this.prisma.voucher.create({
          data: {
            ...voucher,
            usercreatedId: voucher.usercreatedId ?? usercreatedId,
          },
        }),
      ),
    );

    return createdVouchers.map((voucher) => this.mapToDto(voucher));
  }

  async updateVoucher(id: string, dto: UpdateVoucherDTO): Promise<VoucherResponseDto> {
    const existing = await this.prisma.voucher.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Voucher not found');
    }

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.prisma.voucher.findUnique({
        where: { code: dto.code },
      });
      if (duplicate) {
        throw new ConflictException('Voucher with this code already exists');
      }
    }

    const updated = await this.prisma.voucher.update({
      where: { id },
      data: dto,
    });
    return this.mapToDto(updated);
  }

  async deleteVoucher(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.voucher.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Voucher not found');
    }

    await this.prisma.voucher.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Voucher deleted successfully',
    };
  }

  async useVoucher(idOrCode: string, userId: string): Promise<VoucherResponseDto> {
    let voucher = await this.prisma.voucher.findUnique({
      where: { id: idOrCode },
    });
    if (!voucher) {
      voucher = await this.prisma.voucher.findUnique({
        where: { code: idOrCode },
      });
    }

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    if (!voucher.status) {
      throw new BadRequestException('Voucher is inactive or has already been used');
    }

    if (voucher.userId && voucher.userId !== userId) {
      throw new BadRequestException('Voucher is not assigned to this user');
    }

    if (!voucher.reuse) {
      const updated = await this.prisma.voucher.update({
        where: { id: voucher.id },
        data: { status: false },
      });
      return this.mapToDto(updated);
    }

    return this.mapToDto(voucher);
  }

  private mapToDto(voucher: any): VoucherResponseDto {
    return {
      id: voucher.id,
      code: voucher.code,
      title: voucher.title,
      subtitle: voucher.subtitle,
      expiry: voucher.expiry,
      tag: voucher.tag,
      description: voucher.description,
      value: voucher.value,
      max: voucher.max,
      usercreatedId: voucher.usercreatedId,
      status: voucher.status,
      userId: voucher.userId,
      reuse: voucher.reuse,
    };
  }
}
