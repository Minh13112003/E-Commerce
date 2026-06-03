import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";

export class UserResponseDto {
    @ApiProperty({ description: 'Unique identifier of the user', example: '123e4567-e89b-12d3-a456-426614174000' })
    id!: string;
    @ApiProperty({ description: 'Email address of the user', example: 'john.doe@example.com' })
    email!: string;
    @ApiProperty({ description: 'First name of the user', example: 'John', nullable: true })
    firstName!: string | null;
    @ApiProperty({ description: 'Last name of the user', example: 'Doe', nullable: true })
    lastName!: string | null;
    @ApiProperty({ description: 'Roles assigned to the user', enum: Role })
    role!: Role;
    @ApiProperty({ description: 'Date and time when the user was created', example: '2023-01-01T00:00:00.000Z' })
    createdAt!: Date;
    @ApiProperty({ description: 'Date and time when the user was last updated', example: '2023-01-01T00:00:00.000Z' })
    updatedAt!: Date;
    @ApiProperty({description : "PhoneNumber of user"})
    phonenumber!: string
    @ApiProperty({description : "Age of user", nullable: true})
    age!: number | null

}