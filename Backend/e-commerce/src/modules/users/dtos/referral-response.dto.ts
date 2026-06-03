import { ApiProperty } from '@nestjs/swagger';

export class ReferralResponseDto {
  @ApiProperty({ type: String, example: 'BTTMINH2026' })
  referralCode!: string;

  @ApiProperty({ type: Number, example: 5 })
  successReferrals!: number;

  @ApiProperty({ type: Number, example: 1000000 })
  earnedPoints!: number;
}
