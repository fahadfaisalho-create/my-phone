import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { TechnicianStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { RejectTechnicianDto } from './dto/reject-technician.dto';

// طلبات مراجعة رخصة العمل الحر للفنيين اللي تضيفهم المحلات — تحقق يدوي
// مؤقت لحين ربط فعلي مستقبلي مع منصة العمل الحر
@Controller('admin/technicians')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminTechniciansController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  list(@Query('status') status?: TechnicianStatus) {
    return this.adminService.listTechnicians(status);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.adminService.approveTechnician(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectTechnicianDto) {
    return this.adminService.rejectTechnician(id, dto.reason);
  }
}
