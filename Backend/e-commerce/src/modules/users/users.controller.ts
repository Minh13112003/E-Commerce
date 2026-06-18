import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RoleGuard } from '../../common/guard/role.guard';
import { UsersService } from './users.service';
import { UserResponseDto } from './dtos/user-response.dto';
import type { RequestWithUser } from '../../common/interface/request-with-user.interface';
import { UserUpdateDto } from './dtos/user-update.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { Roles } from '../../common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/pagination-response.dto';
import { ReferralResponseDto } from './dtos/referral-response.dto';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RoleGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile information of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role.' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. Failed to retrieve user profile.',
  })
  async getProfile(@Req() req: RequestWithUser): Promise<UserResponseDto> {
    return await this.userService.findOne(req.user.id);
  }

  @Get('referral')
  @ApiOperation({
    summary: 'Get referral statistics for current user',
    description: 'Retrieve the referral code, success count, and earned points of the logged-in user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Referral statistics retrieved successfully.',
    type: ReferralResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async getReferralStats(@GetUser('id') userId: string): Promise<ReferralResponseDto> {
    return await this.userService.getReferralStats(userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users with pagination',
    description:
      'Retrieve a list of all users in the system with pagination. This endpoint is restricted to admin users.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully.',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error. Failed to retrieve users.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getAllUsers(@Query() PaginationQueryDto: PaginationQueryDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    return await this.userService.findAll(PaginationQueryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description:
      'Retrieve the profile information of a user by their unique identifier. This endpoint is restricted to admin users.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role.' })
  @ApiResponse({
    status: 404,
    description: 'Not Found. User with the specified ID does not exist.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. Failed to retrieve user profile.',
  })
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    return await this.userService.findOne(id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update the profile information of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role.' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. Failed to update user profile.',
  })
  @ApiBody({ type: UserUpdateDto })
  async updateProfile(userId: string, @Body() updateData: UserUpdateDto): Promise<UserResponseDto> {
    return await this.userService.update(userId, updateData);
  }

  @Patch('me/password')
  @ApiOperation({
    summary: 'Change user password',
    description: 'Change the password of the currently authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error. Failed to change password.' })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(
    @GetUser('id') userId: string,
    @Body() changePasswordData: ChangePasswordDto
  ): Promise<{ message: string }> {
    return await this.userService.changePassword(userId, changePasswordData);
  }

  @Post('me/fcm-token')
  @ApiOperation({ summary: 'Register or update FCM push token for the current user' })
  @ApiResponse({ status: 200, description: 'FCM token registered.' })
  @ApiBody({ schema: { properties: { fcmToken: { type: 'string' } }, required: ['fcmToken'] } })
  async registerFcmToken(
    @GetUser('id') userId: string,
    @Body('fcmToken') fcmToken: string,
  ): Promise<{ success: boolean }> {
    return this.userService.registerFcmToken(userId, fcmToken);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user by ID',
    description:
      'Delete a user from the system by their unique identifier. This endpoint is restricted to admin users.',
  })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role.' })
  @ApiResponse({
    status: 404,
    description: 'Not Found. User with the specified ID does not exist.',
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error. Failed to delete user.' })
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string): Promise<{ message: string }> {
    return await this.userService.delete(id);
  }
}
