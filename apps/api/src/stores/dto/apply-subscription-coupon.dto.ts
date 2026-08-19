import { IsNotEmpty, IsString } from 'class-validator';

export class ApplySubscriptionCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'اكتب كود الخصم' })
  couponCode: string;
}
