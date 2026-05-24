import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsStrongPassword, MinLength } from "class-validator";

export class RegisterDTOs {
    @IsEmail({},{message : 'Please provide a valid email address'})
    @IsNotEmpty({message : 'Email is required'})
    @ApiProperty({
        description: 'The email address of the user',
        example: 'john.doe@example.com'
    })
    email!: string;

    @IsString({message : 'Password must be string'})
    @IsNotEmpty({message : 'Password is required'})
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    @IsStrongPassword({
        minLowercase : 1,
        minNumbers : 1,
        minSymbols : 1,
        minUppercase : 1
    }, {message : "Mật khẩu phải chứa ít nhất gồm;  1 kí tự thường, 1 kí tự hoa, 1 số và 1 kí tự"})
    @ApiProperty({
        description: 'The password of the user',
        example: 'Password123!'
    })
    password!: string;

    @IsString({message : 'First name must be string'})
    @IsOptional()
    @ApiProperty({
        description: 'The first name of the user',
        example: 'John'
    })

    firstName!: string;

    @IsString({message : 'Last name must be string'})
    @IsOptional()
    @ApiProperty({
        description: 'The last name of the user',
        example: 'Doe'
    })
    lastName!: string;
}