import { Body, Controller, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly adminService: AdminService) {}

  // إعادة تعيين كلمة سر أي حساب (تاجر/موظف/مستهلك) — بديل عملي بلا تكلفة عن
  // بريد/SMS استعادة فعلي: صاحب الحساب يتواصل مع الإدمن خارج المنصة
  @Patch('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetUserPasswordDto) {
    return this.adminService.resetUserPassword(dto.identifier, dto.newPassword);
  }
}
