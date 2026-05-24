import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'List of items' })
  items: T[];

  @ApiProperty({ description: 'Pagination metadata' })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };

  constructor(items: T[], meta: { total: number; page: number; limit: number }) {
    this.items = items;
    this.meta = {
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: Math.ceil(meta.total / meta.limit),
      hasNext: meta.page * meta.limit < meta.total,
      hasPrevious: meta.page > 1,
    };
  }
}
