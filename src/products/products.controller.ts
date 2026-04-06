import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { IdParamDto } from '../common/dto/id-param.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List available products with pagination' })
  @ApiOkResponse({ description: 'Paginated product list' })
  listProducts(@Query() query: PaginationQueryDto) {
    return this.productsService.listProducts(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single product details with stock' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Product details' })
  getProduct(@Param() params: IdParamDto) {
    return this.productsService.getProductById(params.id);
  }
}
