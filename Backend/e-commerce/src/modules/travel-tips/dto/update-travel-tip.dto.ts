import { PartialType } from '@nestjs/swagger';
import { CreateTravelTipDto } from './create-travel-tip.dto';

export class UpdateTravelTipDto extends PartialType(CreateTravelTipDto) {}
