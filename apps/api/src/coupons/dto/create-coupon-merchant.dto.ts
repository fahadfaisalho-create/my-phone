import { OmitType } from '@nestjs/mapped-types';
import { CreateCouponAdminDto } from './create-coupon-admin.dto';

// كوبون يصدره التاجر — يُقفل تلقائياً على متجره فقط، وبنطاق "طلبات" دائماً
// (لا يقدر التاجر يخصم من اشتراكه هو بالمنصة عبر كوبونه الخاص)
export class CreateCouponMerchantDto extends OmitType(CreateCouponAdminDto, ['scope'] as const) {}
