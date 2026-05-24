import { Controller, Post, Query, UseGuards, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBadRequestResponse, ApiNotFoundResponse, ApiTooManyRequestsResponse, ApiInternalServerErrorResponse, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RoleGuard } from '../../common/guard/role.guard';
import { OrdersService } from './orders.service';
import { ModerateThrottler, RelaxedThrottler } from '../../common/decorators/custom-throttler.decorator';
import { CreateOrderDTO } from './dtos/create-order.dto';
import { OrderAPIResponseDto, OrderResponseDto } from './dtos/order-response.dto';
import { Order, Role } from '@prisma/client';
import { Body } from '@nestjs/common';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { QueryOrderDTO } from './dtos/query-order.dto';
import { Roles } from '@/common/decorators/role.decorator';
import { PaginationQueryDto } from '@/common/dtos/pagination.dto';



@ApiTags ('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth('JWT-Auth')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post()
    @ModerateThrottler()
    @ApiOperation({
        summary: 'Create a new order',
        description: 'Create a new order. Only accessible by authenticated users.',
    })
    @ApiBody({ description: 'Order details', type: CreateOrderDTO })
    @ApiResponse({ status: 201, description: 'Order created successfully.', type: OrderAPIResponseDto<Order> })
    @ApiBadRequestResponse({ description: 'Bad Request. Validation failed.' })
    @ApiNotFoundResponse({ description: 'Order not found.' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized. Invalid or missing JWT token.' })
    @ApiForbiddenResponse({ description: 'Forbidden. User does not have the required role.' })
    @ApiInternalServerErrorResponse({ description: 'Internal Server Error. Failed to create order.' })
    @ApiTooManyRequestsResponse({ description: 'Too Many Requests. Please try again later.' })
    async createOrder(@Body() createOrderDTO: CreateOrderDTO, @GetUser('id') userId: string) {

        return this.ordersService.createOrder(createOrderDTO, userId);
    }

    @Get('admin/all')
    @Roles(Role.ADMIN)
    @RelaxedThrottler()
    @ApiOperation({
        summary: '[Admin]Get all orders',
    })
    @ApiPaginatedResponse(OrderResponseDto)
    @ApiForbiddenResponse({ description: 'Forbidden. User does not have the required role.' })
    async getAll(@Query() query: QueryOrderDTO)
    {
        return this.ordersService.getAll(query);
    }
    @Get()
    @RelaxedThrottler()
    @ApiOperation({
        summary: 'Get all orders for current user',
    })
    @ApiPaginatedResponse(OrderResponseDto)
    async getOrders(@Query() query: QueryOrderDTO, @GetUser('id') userId: string)
    {
        return this.ordersService.getOrders(query, userId);
    }

}
