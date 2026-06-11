import { PartialType } from '@nestjs/swagger';
import { CreateDepartureDto } from './create-departure.dto';

export class UpdateDepartureDto extends PartialType(CreateDepartureDto) {}
