import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductsModule } from './modules/products/products.module';
import { CloudinaryService } from './common/cloudinary/cloudinary.service';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingsModule } from './modules/bookings/bookings.module';
import { VouchersModule } from './modules/vouchers/vouchers.module';
import { FeedbacksModule } from './modules/feedbacks/feedbacks.module';
import { ToursModule } from './modules/tours/tours.module';
import { DeparturesModule } from './modules/departures/departures.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { StatsModule } from './modules/stats/stats.module';
import { NewsModule } from './modules/news/news.module';
import { TravelTipsModule } from './modules/travel-tips/travel-tips.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoryModule,
    ProductsModule,
    CloudinaryModule,
    OrdersModule,
    BookingsModule,
    VouchersModule,
    FeedbacksModule,
    ToursModule,
    DeparturesModule,
    NotificationsModule,
    FirebaseModule,
    StatsModule,
    NewsModule,
    TravelTipsModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { ttl: 60, // Thời gian (tính bằng giây) mà mỗi IP có thể thực hiện tối đa 100 yêu cầu
        limit: 10, // Số lượng yêu cầu tối đa mà mỗi IP có thể thực hiện trong khoảng thời gian ttl
      },
    ])],
  controllers: [AppController],
  providers: [AppService, CloudinaryService],
})
export class AppModule {}
