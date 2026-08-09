import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrdersService } from './orders.service';
import { MarkOrderPaidDto } from '../admin/dto/mark-order-paid.dto';

// تأكيد دفع الطلبات يدوياً من الإدمن (بوابة الدفع الفعلية غير مربوطة بعد)
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(@Query('paymentStatus') paymentStatus?: PaymentStatus) {
    return this.ordersService.listAllForAdmin(paymentStatus);
  }

  @Patch(':id/payment')
  setPaid(@Param('id') id: string, @Body() dto: MarkOrderPaidDto) {
    return this.ordersService.setPaymentStatusAsAdmin(id, dto.paid);
  }
}
