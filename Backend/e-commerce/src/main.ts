import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { error } from 'console';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các thuộc tính thừa
      forbidNonWhitelisted: true, // Ném lỗi nếu có thuộc tính không khai báo trong DTO
      transform: true, // Tự động transform kiểu dữ liệu
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000' || '*', // Cho phép tất cả các nguồn hoặc chỉ những nguồn được chỉ định trong biến môi trường
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'], // Các phương thức HTTP được phép
    credentials: true, // Cho phép gửi cookie và thông tin xác thực
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // Các tiêu đề được phép
  });

  const config = new DocumentBuilder()
    .setTitle('API Documentation for E-commerce Application')
    .setDescription(
      'This is the API documentation for the E-commerce application built with NestJS and Prisma.'
    )
    .setVersion('1.0')
    .addTag('Auth', 'Endpoints related to authentication')
    .addTag('Users', 'Endpoints related to user management')
    .addTag('Products', 'Endpoints related to product management')
    .addTag('Categories', 'Endpoints related to category management')
    .addTag('Orders', 'Endpoints related to order management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
        name: 'JWT',
        in: 'header',
      },
      'JWT-Auth'
    ) // Định nghĩa bảo mật cho JWT
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter refresh token',
        name: 'Refresh-Token',
        in: 'header',
      },
      'Refresh-Token'
    ) // Định nghĩa bảo mật cho refresh token
    .addServer(process.env.API_SERVER_URL || 'http://localhost:3000', 'Development Server') // Thêm server URL
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Giữ lại thông tin xác thực sau khi refresh trang
      tagsSorter: 'alpha', // Sắp xếp các tag theo thứ tự alphabet
      operationsSorter: 'alpha', // Sắp xếp các operation theo thứ tự alphabet
    },
    customSiteTitle: 'E-commerce API Documentation', // Tiêu đề trang Swagger UI
    customfavIcon: 'https://nestjs.com/img/favicon.ico', // Biểu tượng favicon cho Swagger UI
    customCss: `
      .swagger-ui .topbar { background-color: #4a90e2; } /* Màu nền cho thanh trên cùng */
      .swagger-ui .topbar a { color: #fff; font-size: 1.5em; font-weight: bold; } /* Kiểu chữ cho tiêu đề */
      .swagger-ui .info { background-color: #f5f5f5; padding: 20px; border-radius: 5px; } /* Màu nền và kiểu dáng cho phần thông tin API */
      .swagger-ui .info h2 { color: #4a90e2; } /* Màu chữ cho tiêu đề API */
      .swagger-ui .info p { color: #333; font-size: 1.1em; } /* Kiểu chữ cho mô tả API */
    `, // CSS tùy chỉnh để cải thiện giao diện Swagger UI
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch(error => {
  Logger.error('Error starting server', error);
  process.exit(1);
});
