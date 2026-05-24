import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDate,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
export class OrderAPIResponseDto<T> {
  @ApiProperty({
    type: Boolean,
    description: 'Indicates if the order was successful',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  success!: boolean;

  @ApiProperty({
    type: Object,
    description: 'The data of the order',
  })
  @IsNotEmpty()
  data!: T;

  @ApiProperty({
    type: String,
    description: 'The message of the order',
    example: 'Order created successfully',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;
}

export class OrderItemResponseDto {
  @ApiProperty({
    type: String,
    description: 'The id of the order item',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    type: String,
    description: 'The id of the product',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({
    type: String,
    description: 'The name of the product',
    example: 'Product Name',
  })
  @IsString()
  @IsNotEmpty()
  productName!: string;

  @ApiProperty({
    type: Number,
    description: 'The quantity of the product',
    example: '1',
  })
  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @ApiProperty({
    type: Number,
    description: 'The price of the product',
    example: '100',
  })
  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @ApiProperty({
    type: Number,
    description: 'The subtotal of the product',
    example: '100',
  })
  @IsNumber()
  @IsNotEmpty()
  subTotal!: number;

  @ApiProperty({
    type: Date,
    description: 'The created at of the order item',
    example: '2021-01-01T00:00:00.000Z',
  })
  @IsDate()
  @IsNotEmpty()
  createdAt!: Date;

  @ApiProperty({
    type: Date,
    description: 'The updated at of the order item',
    example: '2021-01-01T00:00:00.000Z',
  })
  @IsDate()
  @IsNotEmpty()
  updatedAt!: Date;
}

export class OrderResponseDto {
  @ApiProperty({ type: String, example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ type: String, example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ type: String, example: 'user@example.com' })
  @IsString()
  @IsNotEmpty()
  userEmail!: string; // ← Thêm

  @ApiProperty({ type: String, example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty()
  userName!: string; // ← Thêm

  @ApiProperty({ type: String, example: 'PENDING' })
  @IsString()
  @IsNotEmpty()
  status!: string;

  @ApiProperty({ type: Number, example: 100 })
  @IsNumber()
  @IsNotEmpty()
  total!: number;

  @ApiProperty({ type: String, example: '123 Main St, Anytown, USA', required: false })
  @IsString()
  @IsOptional()
  shippingAddress?: string; // ← Sửa thành optional (? )

  @ApiProperty({
    type: [OrderItemResponseDto],
    example: [],
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemResponseDto)
  items!: OrderItemResponseDto[];

  @ApiProperty({ type: Date })
  @IsDate()
  @IsNotEmpty()
  createdAt!: Date;

  @ApiProperty({ type: Date }) // ← Thêm
  @IsDate()
  @IsNotEmpty()
  updatedAt!: Date;
}
