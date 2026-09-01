import { Body, Controller, Get, Patch, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SectionGuard } from '../auth/guards/section.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireSection } from '../auth/decorators/require-section.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { StoresService, UpdateStoreFiles } from './stores.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ApplySubscriptionCouponDto } from './dto/apply-subscription-coupon.dto';
import { registrationFilesStorage, fileFilter, MAX_FILE_SIZE_BYTES } from '../common/multer.config';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard, SectionGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // بيانات المحل الأساسية (الاسم/الحالة/الاشتراك) — يحتاجها كل حساب فرعي عند
  // فتح اللوحة بغض النظر عن صلاحياته المحددة، فما عليها أي قيد قسم
  @Get('me')
  @Roles('merchant_rep', 'employee')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.storesService.findMine(user.id);
  }

  @Patch('me')
  @Roles('merchant_rep', 'employee')
  @RequireSection('settings')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'crFile', maxCount: 1 },
        { name: 'bankFile', maxCount: 1 },
      ],
      { storage: registrationFilesStorage, fileFilter, limits: { fileSize: MAX_FILE_SIZE_BYTES } },
    ),
  )
  updateMine(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStoreDto,
    @UploadedFiles() files: UpdateStoreFiles,
  ) {
    return this.storesService.updateMine(user.id, dto, files);
  }

  // محاكاة دفع فوري للاشتراك (بوابة الدفع الفعلية غير مربوطة بعد)
  @Post('me/subscription/confirm-payment')
  @Roles('merchant_rep')
  confirmSubscriptionPayment(@CurrentUser() user: AuthenticatedUser) {
    return this.storesService.confirmSubscriptionPayment(user.id);
  }

  // تطبيق كوبون خصم (كوبونات الإدمن فقط) على اشتراك المحل الحالي قبل الدفع
  @Post('me/subscription/apply-coupon')
  @Roles('merchant_rep')
  applySubscriptionCoupon(@CurrentUser() user: AuthenticatedUser, @Body() dto: ApplySubscriptionCouponDto) {
    return this.storesService.applySubscriptionCoupon(user.id, dto);
  }
}
