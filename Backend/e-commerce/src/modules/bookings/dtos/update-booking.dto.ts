import { PartialType } from '@nestjs/swagger';
import { CreateBookingDTO } from './create-booking.dto';

export class UpdateBookingDTO extends PartialType(CreateBookingDTO) {}
