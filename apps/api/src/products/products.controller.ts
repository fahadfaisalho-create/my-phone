import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SectionGuard } from '../auth/guards/section.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireSection } from '../auth/decorators/require-section.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { registrationFilesStorage, fileFilter, MAX_FILE_SIZE_BYTES } from '../common/multer.config';

const imageInterceptor = FileInterceptor('image', {
  storage: registrationFilesStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

@Controller('stores/me/products')
@UseGuards(JwtAuthGuard, RolesGuard, SectionGuard)
@Roles('merchant_rep', 'employee')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // القائمة يحتاجها كل من عنده صلاحية "المنتجات" أو "المخزون" (تبويب المخزون
  // يعرض نفس القائمة قبل تعديل الكميات)
  @Get()
  @RequireSection('products', 'inventory')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.productsService.listMine(user.id);
  }

  @Post()
  @RequireSection('products')
  @UseInterceptors(imageInterceptor)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.productsService.create(user.id, dto, image);
  }

  @Patch(':id')
  @RequireSection('products')
  @UseInterceptors(imageInterceptor)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.productsService.update(user.id, id, dto, image);
  }

  @Delete(':id')
  @RequireSection('products')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.productsService.remove(user.id, id);
  }

  // صفحة المخزون: تعديل الكمية فقط — صلاحية "المخزون" وحدها تكفي، بدون حاجة
  // لصلاحية "المنتجات" الكاملة (إضافة/حذف منتجات)
  @Patch(':id/inventory')
  @RequireSection('inventory')
  updateInventory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.productsService.updateInventory(user.id, id, dto);
  }
}
