import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { TaxInvoicesService } from './tax-invoices.service';

// فواتير المحل الخاصة بالتاجر نفسه — راجع تعليق TaxInvoicesService.listForMerchant
@Controller('stores/me/tax-invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant_rep')
export class MerchantTaxInvoicesController {
  constructor(private readonly taxInvoicesService: TaxInvoicesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.taxInvoicesService.listForMerchant(user.id);
  }
}
