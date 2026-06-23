import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UserResponseDto } from './dtos/user-response.dto';
import { UserUpdateDto } from './dtos/user-update.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import * as bcrypt from 'bcrypt';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findOne(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        age : true,
        phonenumber : true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        earnedPoints : true,
        rewardPoints : true,
        successReferrals : true,
        password: false,

      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(pagination: PaginationQueryDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
          age: true,
          phonenumber : true,
          earnedPoints : true,
          rewardPoints : true,
          successReferrals : true,
          // password: false,   // không cần vì đã select explicit
        },
      }),

      this.prisma.user.count(), // đếm tổng số records
    ]);

    return new PaginatedResponseDto<UserResponseDto>(users, {page, limit, total});
  }

  async update(userId: string, updateData: UserUpdateDto): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    if (updateData.email && existingUser.email !== updateData.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (emailExists) {
        throw new BadRequestException('Email already in use');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        password: false,
        age: true,
        phonenumber : true,
        earnedPoints : true,
        rewardPoints : true,
        successReferrals : true,
      },
    });
    return updatedUser;
  }

  async changePassword(
    userId: string,
    changePasswordData: ChangePasswordDto
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !(await bcrypt.compare(changePasswordData.currentPassword, user.password))) {
      throw new BadRequestException('Sai mật khẩu cũ, xin vui lòng nhập đúng mật khẩu cũ của bạn.');
    }

    const hashedPassword = await bcrypt.hash(changePasswordData.newPassword, this.SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.notificationsService.createNotification(
      userId,
      NotificationType.PASSWORD_CHANGED,
      'Đổi mật khẩu thành công',
      'Kính gửi Quý khách, mật khẩu tài khoản của Quý khách đã được cập nhật thành công. Nhằm bảo mật thông tin, nếu Quý khách không thực hiện thao tác này, vui lòng liên hệ ngay với bộ phận CSKH để được hỗ trợ kịp thời. Trân trọng!',
    );

    return { message: 'Đổi mật khẩu thành công' };
  }

  async delete(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }

  async registerFcmToken(userId: string, fcmToken: string): Promise<{ success: boolean }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });
    return { success: true };
  }

  async getReferralStats(userId: string): Promise<{ referralCode: string; successReferrals: number; earnedPoints: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        successReferrals: true,
        earnedPoints: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let referralCode = user.referralCode;
    if (!referralCode) {
      const namePart = ((user.firstName || '') + (user.lastName || '')).toUpperCase().replace(/[^A-Z]/g, '');
      const randPart = Math.floor(1000 + Math.random() * 9000);
      referralCode = `BTT${namePart}${randPart}`.substring(0, 30);
      
      await this.prisma.user.update({
        where: { id: userId },
        data: { referralCode },
      });
    }

    return {
      referralCode,
      successReferrals: user.successReferrals,
      earnedPoints: user.earnedPoints,
    };
  }
}
