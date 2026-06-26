export class TourResponseDto {
  id: string;
  name: string;
  slug?: string;
  imageUrl: string;
  imagePublicId: string;
  duration: string;
  rating: number;
  reviewsCount: number;
  hasVat: boolean;
  departureFrom: string;
  transport: string;
  included: string[];
  notIncluded: string[];
  notes?: string;
  tourCountry?: string;
  tourRegion?: string;
  tourCity?: string;
  tourType?: string;
  bookingCount?: number;
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
  departures?: {
    tourCode: string,
    tourId: string,
    departureDate: string,
    availableSeats: number,
    price: number,
  }[];
}
