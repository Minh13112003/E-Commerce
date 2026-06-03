import { ApiProperty } from '@nestjs/swagger';

export class FeedbackResponseDto {
  @ApiProperty({ type: String, example: 'f1' })
  id!: string;

  @ApiProperty({ type: String, example: 'Góp ý dịch vụ Tour' })
  subject!: string;

  @ApiProperty({ type: String, example: 'Nội dung phản hồi chi tiết của khách hàng...' })
  content!: string;

  @ApiProperty({ type: String, example: '123e4567-e89b-12d3-a456-426614174000' })
  userId!: string;

  @ApiProperty({ type: Date })
  createdAt!: Date;
}

export class FeedbackActionResponseDto {
  @ApiProperty({ type: Boolean, example: true })
  success!: boolean;

  @ApiProperty({ type: String, example: 'Cảm ơn bạn đã đóng góp ý kiến phản hồi.' })
  message!: string;
}
