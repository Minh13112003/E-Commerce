import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VoucherResponseDto } from './dtos/voucher-response.dto';
import { CreateVoucherDTO } from './dtos/create-voucher.dto';
import { UpdateVoucherDTO } from './dtos/update-voucher.dto';

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllVouchers(): Promise<VoucherResponseDto[]> {
    const vouchers = await this.prisma.voucher.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return vouchers.map(v => this.mapToDto(v));
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

  async createVoucher(dto: CreateVoucherDTO): Promise<VoucherResponseDto> {
    const existing = await this.prisma.voucher.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Voucher with this code already exists');
    }

    const voucher = await this.prisma.voucher.create({
      data: dto,
    });
    return this.mapToDto(voucher);
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
    };
  }
}
