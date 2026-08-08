import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { MarkSubscriptionPaidDto } from './dto/mark-subscription-paid.dto';

@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminSubscriptionsController {
  constructor(private readonly adminService: AdminService) {}

  @Patch(':id/payment')
  setPaid(@Param('id') id: string, @Body() dto: MarkSubscriptionPaidDto) {
    return this.adminService.setSubscriptionPaid(id, dto.paid);
  }
}
