import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ type: String })
  title: string;

  @ApiProperty({ type: String })
  message: string;

  @ApiProperty({ type: Boolean })
  isRead: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;
}
