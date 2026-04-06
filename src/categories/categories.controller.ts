import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CategoryIdParamDto } from '../common/dto/category-id-param.dto';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all product categories' })
  @ApiOkResponse({ description: 'List of categories' })
  listCategories() {
    return this.categoriesService.listCategories();
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'List products in a category' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Category products (paginated)' })
  listCategoryProducts(
    @Param() params: CategoryIdParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.categoriesService.listCategoryProducts(params.id, query);
  }
}
