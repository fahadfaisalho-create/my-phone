import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { StoreStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { RejectStoreDto } from './dto/reject-store.dto';

@Controller('admin/stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  list(@Query('status') status?: StoreStatus) {
    return this.adminService.listStores(status);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.adminService.approveStore(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectStoreDto) {
    return this.adminService.rejectStore(id, dto.reason);
  }

  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.adminService.suspendStore(id);
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.adminService.reactivateStore(id);
  }
}
