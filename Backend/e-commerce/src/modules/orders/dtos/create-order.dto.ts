import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator"

class OrderItemDTO {

   @ApiProperty(
    {
        type: String,
        description: 'ID of the product being ordered',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @IsString()
    @IsNotEmpty()
    productId!: string

    @ApiProperty(
    {
        type: Number,
        description: 'Quantity of the product being ordered',
        example: 2
    })
    @IsNotEmpty()
    @IsNumber()
    quantity!: number


    @ApiProperty(
    {
        type: Number,
        description: 'Price of the product being ordered',
        example: 25000
    })
    @IsNotEmpty()
    @IsNumber({maxDecimalPlaces: 2},{message: 'Price must be a valid number (eg: 25000)'})
    @Type(() => Number)
    price!: number
}


export class CreateOrderDTO{
    @ApiProperty(
        {
            type: [OrderItemDTO], 
            description: 'List of items in the order',
            example: [
                {
                    productId: '123e4567-e89b-12d3-a456-426614174000',
                    quantity: 2,
                    price: 25000

                },
                {
                    productId: '123e4567-e89b-12d3-a456-426614174001',
                    quantity: 1,
                    price: 15000
                }
            ]
        }
    )
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @IsArray()
    @Type(() => OrderItemDTO)
    items!: OrderItemDTO[]

    @ApiProperty(
        {
            type: String,
            description: 'Shipping address for the order',
            example: '123 Main St, Anytown, USA',
            required: false
        }
    )
    @IsString()
    @IsOptional()
    shippingAddress!: string
}