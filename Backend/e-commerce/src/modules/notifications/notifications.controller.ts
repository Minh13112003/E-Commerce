import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RoleGuard } from '../../common/guard/role.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';
import { NotificationResponseDto } from './dtos/notification-response.dto';
import { RelaxedThrottler } from '../../common/decorators/custom-throttler.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth('JWT-Auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @RelaxedThrottler()
  @ApiOperation({ summary: 'Get my notifications (paginated)' })
  @ApiResponse({ status: 200, type: [NotificationResponseDto] })
  async getMyNotifications(
    @GetUser('id') userId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.notificationsService.getMyNotifications(userId, pagination.page, pagination.limit);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200 })
  async markAllAsRead(@GetUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  async markAsRead(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(id, userId);
  }
}
