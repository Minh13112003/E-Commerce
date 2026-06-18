import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateDepartureDto } from './create-departure.dto';

export class UpdateDepartureDto extends PartialType(CreateDepartureDto) {
  @IsOptional()
  @IsString()
  reason?: string;
}
