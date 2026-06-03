import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFeedbackDTO {
  @ApiProperty({
    type: String,
    description: 'Subject of the feedback',
    example: 'Góp ý dịch vụ Tour',
  })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({
    type: String,
    description: 'Detailed content of the feedback',
    example: 'Nội dung phản hồi chi tiết của khách hàng...',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
