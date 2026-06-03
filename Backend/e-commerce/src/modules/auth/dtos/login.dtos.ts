import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, MinLength } from 'class-validator';

export default class LoginDTOs {
  @IsNotEmpty({ message: 'Email or Phone number is required' })
  @IsString({ message: 'Identifier must be a string' })
  @ApiProperty({
    description: 'The email address or phone number of the user',
    example: 'nguyennhatminhhbt@gmail.com hoặc 0987654321',
  })
  identifier!: string; 

  @IsString({ message: 'Password must be string' })
  @IsNotEmpty({ message: 'Password is required' })
  @ApiProperty({
    description: 'The password of the user',
    example: 'Curin123#',
  })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @IsStrongPassword(
    {
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    },
    { message: 'Mật khẩu phải chứa ít nhất gồm;  1 kí tự thường, 1 kí tự hoa, 1 số và 1 kí tự' }
  )
  password!: string;
}
