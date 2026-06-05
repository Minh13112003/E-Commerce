import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsNumberString, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTourDTO {
  @ApiProperty({
    type: String,
    description: 'Name of the tour',
    example: 'Du lịch Hàn Quốc (Mùa Hoa Anh Đào): Seoul - Nami - Everland - Công viên Yeouido',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    type: Number,
    description: 'Price of the tour',
    example: 15990000,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  price!: number;

  @ApiProperty({
    type: String,
    description: 'Duration of the tour',
    example: '5 Ngày 4 Đêm',
  })
  @IsString()
  @IsNotEmpty()
  duration!: string;
}
