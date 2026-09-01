import { Body, Controller, Delete, Get, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { buildExcelBuffer } from '../common/excel.util';

const RIYADH_TZ = 'Asia/Riyadh';
function formatDate(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: RIYADH_TZ });
}

// إدارة الحسابات الفرعية — لصاحب المحل فقط (merchant_rep)، لا حساب فرعي
// يقدر يوصلها إطلاقاً (لا 'employee' بالأدوار المسموحة هنا عمداً)
@Controller('stores/me/employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant_rep')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.listMine(user.id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.employeesService.remove(user.id, id);
  }

  // تصدير بيانات الحسابات الفرعية الأساسية إكسل — الاسم كامل، الجوال،
  // الهوية، تاريخ الميلاد، تاريخ المباشرة (إنشاء الحساب)
  @Get('export')
  async export(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const employees = await this.employeesService.listMine(user.id);
    const buffer = await buildExcelBuffer(
      'الحسابات الفرعية',
      [
        { header: 'الاسم الكامل', key: 'name', width: 28 },
        { header: 'رقم الجوال', key: 'phone', width: 18 },
        { header: 'رقم الهوية', key: 'nationalId', width: 18 },
        { header: 'تاريخ الميلاد', key: 'birthDate', width: 16 },
        { header: 'تاريخ المباشرة', key: 'startDate', width: 16 },
        { header: 'الحالة', key: 'status', width: 12 },
      ],
      employees.map((e) => ({
        name: `${e.firstName} ${e.lastName}`,
        phone: e.user.phone ?? '',
        nationalId: e.nationalId,
        birthDate: formatDate(e.birthDate),
        startDate: formatDate(e.createdAt),
        status: e.active ? 'فعّال' : 'موقوف',
      })),
    );
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="employees.xlsx"',
    });
    res.send(buffer);
  }
}
