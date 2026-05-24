import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDTO } from './dtos/create-order.dto';
import { Order, OrderItem, OrderStatus, Product, User } from '@prisma/client';
import { OrderAPIResponseDto, OrderResponseDto } from './dtos/order-response.dto';
import { Prisma } from '@prisma/client';
import { QueryOrderDTO } from './dtos/query-order.dto';
import { PaginatedResponseDto } from '@/common/dtos/pagination-response.dto';
import { PaginationQueryDto } from '@/common/dtos/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) {}

  async createOrder(createOrderDTO: CreateOrderDTO, userId: string) {
    const { items, shippingAddress } = createOrderDTO;

    
    for (const item of items) {
        const product = await this.prismaService.product.findUnique({
            where: { id: item.productId },
        });

        if (!product) throw new NotFoundException(`Product not found`);
        if (product.stock < item.quantity) {
            throw new BadRequestException(
                `Insufficient stock for ${product.name}`
            );
        }
    }

    const total = items.reduce((sum, item) => sum + item.quantity * Number(item.price), 0);
    
    const latestCart = await this.prismaService.cart.findFirst({
        where: { userId, checkedOut: false },
        orderBy: { createdAt: 'desc' },
    });

    // === TRANSACTION RẤT NHẸ === 
    const newOrder = await this.prismaService.$transaction(async (tx) => {
        
        const order = await tx.order.create({
            data: {
                userId,
                status: OrderStatus.PENDING,
                totalAmount: new Prisma.Decimal(total.toFixed(2)),
                shippingAddress,
                cartId: latestCart?.id,
                orderItems: {
                    create: items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: new Prisma.Decimal(item.price),
                    }))
                }
            },
        });

        
        await tx.product.updateMany({
            where: {
                id: { in: items.map(item => item.productId) }
            },
            data: {
                stock: {
                    decrement: items[0].quantity   // vì chỉ có 1 item
                }
            }
        });

        return order;
    }, { 
        timeout: 7000   // vẫn giữ 7s để an toàn, nhưng transaction giờ rất nhẹ
    });

    // Fetch full order
    const fullOrder = await this.prismaService.order.findUnique({
        where: { id: newOrder.id },
        include: {
            orderItems: { include: { product: true } },
            user: true,
        },
    });

    return this.wrap(fullOrder!);
  }

  async getAll(query: QueryOrderDTO){
    const { page = 1, limit = 36, status, search } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if(status) where.status = status;
    if(search)
      where.OR = [
    {
      id : {contains: search, mode: 'insensitive'}
    },
    {
      orderNumber : {contains: search, mode: 'insensitive'}
    }
  ];
  const [orders, total] = await Promise.all([
    this.prismaService.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        orderItems: { include: { product: true } },
        user: true
      },
      orderBy: { createdAt: 'desc' },
    }),
    this.prismaService.order.count({ where }),
  ]);

  return new PaginatedResponseDto<OrderResponseDto>(orders.map(order => this.map(order)), {page, limit, total});
  }

  async getOrders(query: QueryOrderDTO, userId: string) {
    const {page = 1, limit = 36, search, status} = query;
    const skip = (page - 1) * limit;
    const where: any = {userId};
    if(status) where.status = status;
    if(search)
      where.OR = [
    {
      id : {contains: search, mode: 'insensitive'}
    }]
    const [orders, total] = await Promise.all([
      this.prismaService.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          orderItems: { include: { product: true } },
          user: true
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.order.count({ where }),
    ]);
    return new PaginatedResponseDto<OrderResponseDto>(orders.map(order => this.map(order)), {page, limit, total});
  }

  private wrap(order: any): OrderAPIResponseDto<OrderResponseDto> {
    return {
      success: true,
      message: 'Order received successfully',
      data: this.map(order),
    };
  }

  private map(
    order: Order & {
      orderItems: (OrderItem & { product: Product })[];
      user: User;
    }
  ): OrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      total: Number(order.totalAmount),
      shippingAddress: order.shippingAddress ?? '',
      items: order.orderItems.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
        subTotal: Number(item.quantity) * Number(item.price),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      // User info
      userEmail: order.user.email,
      userName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),

      createdAt: order.createdAt,
      updatedAt: order.updatedAt, // Sửa lỗi typo
    };
  }
}
