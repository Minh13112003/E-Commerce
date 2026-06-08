import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTourDTO {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsString()
  duration: string;

  @IsString()
  @IsOptional()
  tourCode?: string;

  @IsString()
  @IsOptional()
  departureFrom?: string;

  @IsString()
  @IsOptional()
  transport?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  included?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  notIncluded?: string[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTourScheduleDto)
  @IsOptional()
  schedules?: CreateTourScheduleDto[];
}

export class CreateTourScheduleDto {
  @IsInt()
  dayNumber: number;

  @IsString()
  title: string;


  @IsString()
  @IsOptional()
  morning?: string;

  @IsString()
  @IsOptional()
  noon?: string;

  @IsString()
  @IsOptional()
  afternoon?: string;

  @IsString()
  @IsOptional()
  evening?: string;

  @IsString()
  @IsOptional()
  night?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  meals?: string[];
}
