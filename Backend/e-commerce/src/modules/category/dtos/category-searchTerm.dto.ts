import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dtos/pagination.dto';
export class CategorySearchTermDto extends PaginationQueryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Search term for filtering results',
    example: 'search term, SearchTerm, searchTerm',
    required: false,
  })
  searchTerm!: string;
}
