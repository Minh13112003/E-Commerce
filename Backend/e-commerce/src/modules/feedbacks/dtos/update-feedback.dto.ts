import { PartialType } from '@nestjs/swagger';
import { CreateFeedbackDTO } from './create-feedback.dto';

export class UpdateFeedbackDTO extends PartialType(CreateFeedbackDTO) {}
