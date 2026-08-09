import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // --- المستهلك ---
  @Post('orders')
  @Roles('consumer')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Get('orders/me')
  @Roles('consumer')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listMine(user.id);
  }

  // ملاحظة: تأكيد الدفع لم يعد ذاتياً من المستهلك — الإدمن يؤكده يدوياً (AdminOrdersController)
  // لحد ربط بوابة دفع فعلية، بنفس منطق تأكيد دفع اشتراك المحل.

  // --- التاجر ---
  @Get('stores/me/orders')
  @Roles('merchant_rep')
  listForMyStore(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listForMyStore(user.id);
  }

  @Patch('stores/me/orders/:id/status')
  @Roles('merchant_rep')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(user.id, id, dto.status);
  }
}
