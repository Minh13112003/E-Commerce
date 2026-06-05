import { PartialType } from '@nestjs/swagger';
import { CreateTourDTO } from './create-tour.dto';

export class UpdateTourDTO extends PartialType(CreateTourDTO) {}
