import { IsNotEmpty, IsString, IsStrongPassword } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ChangePasswordDto {
    @ApiProperty({ description: 'Current password of the user', example: 'currentPassword123@'})
    @IsNotEmpty({ message: 'Current password is required' })
    @IsString({ message: 'Current password must be a string' })
    currentPassword!: string;

    @ApiProperty({ description: 'New password of the user', example: 'newPassword123@' })
    @IsNotEmpty({ message: 'New password is required' })
    @IsString({ message: 'New password must be a string' })
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    }, { message: 'New password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one symbol' })
    newPassword!: string;
}