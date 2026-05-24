import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTOs } from './dtos/register.dtos';
import { AuthResponseDTOs } from './dtos/auth_response.dtos';
import { UseGuards } from '@nestjs/common';
import { RefreshTokenGuard } from './guard/refresh-token.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import LoginDTOs from './dtos/login.dtos';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { Public } from 'src/common/decorators/pubic.decorator';



@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}
    //Register
    @Post('register')
    @Public()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new user', description: 'Create a new user account.' })
    @ApiResponse({ status: 201, description: 'User registered successfully.', type: AuthResponseDTOs })
    @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
    @ApiResponse({ status: 500, description: 'Internal Server Error. Failed to create user.' })
    @ApiResponse({ status: 429, description: 'Too Many Requests. Please try again later.' })
    async register(@Body() registerDTOs: RegisterDTOs) : Promise<AuthResponseDTOs>{
        return await this.authService.register(registerDTOs);
    }

    //Refresh token
    @Post('refresh-token')
    @UseGuards(RefreshTokenGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh authentication token', description: 'Generate a new access token using a valid refresh token.' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully.', type: AuthResponseDTOs })
    @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or expired refresh token.' })
    @ApiResponse({ status: 500, description: 'Internal Server Error. Failed to refresh token.' })
    @ApiResponse({ status: 429, description: 'Too Many Requests. Please try again later.' })
    async refreshToken(@GetUser('id') userId: string) : Promise<AuthResponseDTOs>{
        return await this.authService.refreshToken(userId);
    }
    
    //Log out
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('JWT-Auth')
    @ApiOperation({ summary: 'Logout user', description: 'Invalidate the user\'s refresh token and log them out.' })
    @ApiResponse({ status: 200, description: 'Logout successful.' })
    async logout(@GetUser('id') userId: string) : Promise<{message: string}>{
        await this.authService.logout(userId);
        return {message : "Logout successful"};
    }

    //Login
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user', description: 'Authenticate user and return access and refresh tokens.' })
    @ApiResponse({ status: 200, description: 'Login successful.', type: AuthResponseDTOs })
    @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Invalid email or password.' })
    @ApiResponse({ status: 500, description: 'Internal Server Error. Failed to login.' })
    @ApiResponse({ status: 429, description: 'Too Many Requests. Please try again later.' })
    async login(@Body() loginDTOs: LoginDTOs) : Promise<AuthResponseDTOs>{
        return await this.authService.login(loginDTOs);
    }

}
