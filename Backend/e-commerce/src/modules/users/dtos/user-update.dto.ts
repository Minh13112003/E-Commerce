import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, Max, Min } from "class-validator";

export class UserUpdateDto {
    @ApiProperty({ description: 'Email address of the user', example: 'john.doe@example.com', nullable: true })
    @IsOptional()
    email?: string;
    @ApiProperty({ description: 'First name of the user', example: 'John', nullable: true })
    @IsOptional()
    firstName?: string;
    @ApiProperty({ description: 'Last name of the user', example: 'Doe', nullable: true })
    @IsOptional()
    lastName?: string;
    @ApiProperty({ description: 'Age of the user', example: '30', nullable: true })
    @Max(100) 
    @Min(10)
    @IsOptional()
    age?: number

}