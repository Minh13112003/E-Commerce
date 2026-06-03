import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RoleGuard } from '../../common/guard/role.guard';
import { FeedbacksService } from './feedbacks.service';
import { RelaxedThrottler } from '../../common/decorators/custom-throttler.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { FeedbackResponseDto, FeedbackActionResponseDto } from './dtos/feedback-response.dto';
import { CreateFeedbackDTO } from './dtos/create-feedback.dto';
import { UpdateFeedbackDTO } from './dtos/update-feedback.dto';

@ApiTags('Feedbacks')
@Controller('feedbacks')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth('JWT-Auth')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Post()
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Submit feedback',
    description: 'Submit feedback or suggestions to the administration.',
  })
  @ApiBody({ type: CreateFeedbackDTO })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully.', type: FeedbackActionResponseDto })
  @ApiBadRequestResponse({ description: 'Bad Request. Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async createFeedback(
    @Body() dto: CreateFeedbackDTO,
    @GetUser('id') userId: string,
  ): Promise<FeedbackActionResponseDto> {
    return this.feedbacksService.createFeedback(dto, userId);
  }

  @Get()
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Get all feedbacks for current user',
    description: 'Retrieve a list of feedbacks submitted by the logged-in user.',
  })
  @ApiResponse({ status: 200, description: 'Feedbacks list retrieved successfully.', type: [FeedbackResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async getAllFeedbacks(@GetUser('id') userId: string): Promise<FeedbackResponseDto[]> {
    return this.feedbacksService.getAllFeedbacks(userId);
  }

  @Get(':id')
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Get specific feedback by ID',
    description: 'Retrieve a specific feedback submitted by the logged-in user.',
  })
  @ApiResponse({ status: 200, description: 'Feedback data retrieved successfully.', type: FeedbackResponseDto })
  @ApiNotFoundResponse({ description: 'Feedback not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async getFeedbackById(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ): Promise<FeedbackResponseDto> {
    return this.feedbacksService.getFeedbackById(id, userId);
  }

  @Patch(':id')
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Update feedback',
    description: 'Update a feedback submitted by the logged-in user.',
  })
  @ApiBody({ type: UpdateFeedbackDTO })
  @ApiResponse({ status: 200, description: 'Feedback updated successfully.', type: FeedbackResponseDto })
  @ApiNotFoundResponse({ description: 'Feedback not found.' })
  @ApiBadRequestResponse({ description: 'Bad Request. Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async updateFeedback(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDTO,
    @GetUser('id') userId: string,
  ): Promise<FeedbackResponseDto> {
    return this.feedbacksService.updateFeedback(id, dto, userId);
  }

  @Delete(':id')
  @RelaxedThrottler()
  @ApiOperation({
    summary: 'Delete feedback',
    description: 'Delete a feedback submitted by the logged-in user.',
  })
  @ApiResponse({ status: 200, description: 'Feedback deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Feedback not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async deleteFeedback(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.feedbacksService.deleteFeedback(id, userId);
  }
}
