import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ZatcaStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TaxInvoicesService } from './tax-invoices.service';

@Controller('admin/tax-invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminTaxInvoicesController {
  constructor(private readonly taxInvoicesService: TaxInvoicesService) {}

  @Get()
  list(@Query('status') status?: ZatcaStatus) {
    return this.taxInvoicesService.listForAdmin(status);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.taxInvoicesService.getOneForAdmin(id);
  }

  @Patch(':id/resend')
  resend(@Param('id') id: string) {
    return this.taxInvoicesService.resend(id);
  }
}
