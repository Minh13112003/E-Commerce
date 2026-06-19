import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../../common/cloudinary/cloudinary.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { TravelTipsController } from './travel-tips.controller';
import { TravelTipsService } from './travel-tips.service';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [TravelTipsController],
  providers: [TravelTipsService],
  exports: [TravelTipsService],
})
export class TravelTipsModule {}
