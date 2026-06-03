import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedbackResponseDto, FeedbackActionResponseDto } from './dtos/feedback-response.dto';
import { CreateFeedbackDTO } from './dtos/create-feedback.dto';
import { UpdateFeedbackDTO } from './dtos/update-feedback.dto';

@Injectable()
export class FeedbacksService {
  constructor(private readonly prisma: PrismaService) {}

  async createFeedback(dto: CreateFeedbackDTO, userId: string): Promise<FeedbackActionResponseDto> {
    await this.prisma.feedback.create({
      data: {
        subject: dto.subject,
        content: dto.content,
        userId,
      },
    });

    return {
      success: true,
      message: 'Cảm ơn bạn đã đóng góp ý kiến phản hồi.',
    };
  }

  async getAllFeedbacks(userId: string): Promise<FeedbackResponseDto[]> {
    const feedbacks = await this.prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return feedbacks.map(f => this.mapToDto(f));
  }

  async getFeedbackById(id: string, userId: string): Promise<FeedbackResponseDto> {
    const feedback = await this.prisma.feedback.findFirst({
      where: { id, userId },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return this.mapToDto(feedback);
  }

  async updateFeedback(id: string, dto: UpdateFeedbackDTO, userId: string): Promise<FeedbackResponseDto> {
    const existing = await this.prisma.feedback.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Feedback not found');
    }

    const updated = await this.prisma.feedback.update({
      where: { id },
      data: dto,
    });

    return this.mapToDto(updated);
  }

  async deleteFeedback(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.feedback.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Feedback not found');
    }

    await this.prisma.feedback.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Feedback deleted successfully',
    };
  }

  private mapToDto(feedback: any): FeedbackResponseDto {
    return {
      id: feedback.id,
      subject: feedback.subject,
      content: feedback.content,
      userId: feedback.userId,
      createdAt: feedback.createdAt,
    };
  }
}
