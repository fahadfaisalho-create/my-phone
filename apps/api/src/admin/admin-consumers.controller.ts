import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin/consumers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminConsumersController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  list(@Query('search') search?: string, @Query('page') page?: string) {
    return this.adminService.listConsumers(search, page ? Number(page) : 1);
  }

  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.adminService.suspendConsumer(id);
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.adminService.reactivateConsumer(id);
  }
}
