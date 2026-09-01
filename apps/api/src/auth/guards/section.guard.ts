import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StoreSection } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRE_SECTION_KEY } from '../decorators/require-section.decorator';

// يتحقق من صلاحية القسم (تبويب لوحة التاجر) للحسابات الفرعية (role=employee)
// فقط — صاحب المحل نفسه (merchant_rep) وأي دور آخر يمر دائماً بدون أي قيد
// إضافي، حتى لو المسار عليه @RequireSection. يُستخدم دائماً بعد
// JwtAuthGuard/RolesGuard بنفس مصفوفة @UseGuards.
@Injectable()
export class SectionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const sections = this.reflector.getAllAndOverride<StoreSection[]>(REQUIRE_SECTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!sections || sections.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || user.role !== 'employee') return true;

    const profile = await this.prisma.employeeProfile.findUnique({ where: { userId: user.id } });
    if (!profile || !profile.active || !sections.some((s) => profile.permissions.includes(s))) {
      throw new ForbiddenException('لا تملك صلاحية الوصول لهذا القسم');
    }
    return true;
  }
}
