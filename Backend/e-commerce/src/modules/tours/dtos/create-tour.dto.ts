import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTourDTO {
  @IsString()
  name: string;

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

  @IsString()
  @IsOptional()
  tourCountry?: string;

  @IsString()
  @IsOptional()
  tourRegion?: string;

  @IsString()
  @IsOptional()
  tourCity?: string;

  @IsString()
  @IsOptional()
  tourType?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTourScheduleDto)
  @IsOptional()
  schedules?: CreateTourScheduleDto[];

  @ApiProperty({
  type: [String],
  example: ["2024-07-01", "2024-07-15"],
  description: "Các ngày khởi hành tour",
  required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  departureDays?: string[];


  @ApiProperty({
    type: Number,
    example: 100,
    description: "Số chỗ trống",
    required: false,
  })
  @IsNumber()
  @IsOptional()
  availableSeats?: number;

  @ApiProperty({
    type: Number,
    example: 5000000,
    description: "Giá tour",
    required: true,
  })
  @IsNumber()
  price: number;

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
