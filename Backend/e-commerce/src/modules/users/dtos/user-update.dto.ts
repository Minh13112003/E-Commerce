import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

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
}