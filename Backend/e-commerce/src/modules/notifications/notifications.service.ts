import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';
import { NotificationResponseDto } from './dtos/notification-response.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseService,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    refId?: string,
    refType?: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, message, refId: refId ?? null, refType: refType ?? null },
    });

    // Send FCM push if user has a registered token
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });
    if (user?.fcmToken) {
      await this.firebase.sendPush(user.fcmToken, title, message, {
        type,
        ...(refId && { refId }),
        ...(refType && { refType }),
      });
    }

    return notification;
  }

  async getMyNotifications(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponseDto<NotificationResponseDto>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return new PaginatedResponseDto(data, { total, page, limit });
  }

  async markAsRead(id: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { count: result.count };
  }
}
