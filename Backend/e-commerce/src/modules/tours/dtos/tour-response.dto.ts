import { ApiProperty } from '@nestjs/swagger';

export class TourResponseDto {
  id: string;
  name: string;
  imageUrl: string;
  imagePublicId: string;
  price: number;
  duration: string;
  rating: number;
  reviewsCount: number;
  hasVat: boolean;
  departureFrom: string;
  transport: string;
  included: string[];
  notIncluded: string[];
  notes?: string;
  schedules?: {
    id: string;
    dayNumber: number;
    title: string;
    morning: string;
    noon: string;
    afternoon: string;
    evening: string;
    night: string;
    meals: string[];
  }[];
  
}
