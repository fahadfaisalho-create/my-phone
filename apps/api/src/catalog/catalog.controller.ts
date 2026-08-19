import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

// endpoints عامة لتصفح المستهلك — بدون مصادقة
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('stores')
  listStores(@Query('search') search?: string) {
    return this.catalogService.listStores(search);
  }

  @Get('featured-stores')
  listFeaturedStores() {
    return this.catalogService.listFeaturedStores();
  }

  @Get('stores/:id')
  getStore(@Param('id') id: string) {
    return this.catalogService.getStore(id);
  }
}
