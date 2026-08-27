import { Module } from '@nestjs/common';
import { AdminTaxInvoicesController } from './admin-tax-invoices.controller';
import { TaxInvoicesService } from './tax-invoices.service';
import { ZatcaClientService } from './zatca-client.service';

@Module({
  controllers: [AdminTaxInvoicesController],
  providers: [TaxInvoicesService, ZatcaClientService],
  exports: [TaxInvoicesService],
})
export class TaxInvoicesModule {}
