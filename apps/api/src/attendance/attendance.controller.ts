import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { AttendanceService } from './attendance.service';
import { CheckInOutDto } from './dto/check-inout.dto';
import { buildExcelBuffer } from '../common/excel.util';

// السعودية بلا توقيت صيفي (UTC+3 ثابت) — نعرض التاريخ/الوقت بتوقيتها المحلي
// بدل UTC حتى تكون ساعات الحضور/الانصراف بملف الإكسل مفهومة فعلياً
const RIYADH_TZ = 'Asia/Riyadh';
function formatDate(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: RIYADH_TZ });
}
function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { timeZone: RIYADH_TZ, hour: '2-digit', minute: '2-digit' });
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // --- الموظف نفسه ---
  @Post('attendance/check-in')
  @Roles('employee')
  checkIn(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckInOutDto) {
    return this.attendanceService.checkIn(user.id, dto);
  }

  @Post('attendance/check-out')
  @Roles('employee')
  checkOut(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckInOutDto) {
    return this.attendanceService.checkOut(user.id, dto);
  }

  @Get('attendance/me')
  @Roles('employee')
  myStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.attendanceService.myStatus(user.id);
  }

  // --- صاحب المحل: عرض وتصدير سجلات كل الموظفين، مع فلترة اختيارية بتاريخ من/إلى ---
  @Get('stores/me/attendance')
  @Roles('merchant_rep')
  list(@CurrentUser() user: AuthenticatedUser, @Query('from') from?: string, @Query('to') to?: string) {
    return this.attendanceService.listForStore(user.id, from, to);
  }

  @Get('stores/me/attendance/export')
  @Roles('merchant_rep')
  async export(
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const records = await this.attendanceService.listForStore(user.id, from, to);
    const buffer = await buildExcelBuffer(
      'الحضور والانصراف',
      [
        { header: 'اسم الموظف', key: 'name', width: 26 },
        { header: 'تاريخ الحضور', key: 'checkInDate', width: 16 },
        { header: 'وقت الحضور', key: 'checkInTime', width: 14 },
        { header: 'تاريخ الانصراف', key: 'checkOutDate', width: 16 },
        { header: 'وقت الانصراف', key: 'checkOutTime', width: 14 },
      ],
      records.map((r) => ({
        name: `${r.employee.firstName} ${r.employee.lastName}`,
        checkInDate: formatDate(r.checkInAt),
        checkInTime: formatTime(r.checkInAt),
        checkOutDate: r.checkOutAt ? formatDate(r.checkOutAt) : '',
        checkOutTime: r.checkOutAt ? formatTime(r.checkOutAt) : 'لم ينصرف بعد',
      })),
    );
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="attendance.xlsx"',
    });
    res.send(buffer);
  }
}
