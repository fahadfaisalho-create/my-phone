import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CourierProvider, DeliveryMethod, DeliveryType } from '@prisma/client';

export class OrderItemInput {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'الكمية يجب أن تكون 1 على الأقل' })
  qty: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'السلة فارغة' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];

  // طريقة الاستلام: من الفرع أو توصيل — إذا لم يُرسل يُعتبر "استلام من الفرع"
  @IsOptional()
  @IsEnum(DeliveryType, { message: 'طريقة الاستلام غير صحيحة' })
  deliveryType?: DeliveryType;

  // إلزامي فقط عند اختيار التوصيل
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsLatitude({ message: 'إحداثية خط العرض غير صحيحة' })
  deliveryLat?: number;

  @IsOptional()
  @IsLongitude({ message: 'إحداثية خط الطول غير صحيحة' })
  deliveryLng?: number;

  // شركة الشحن — إلزامية فقط عند اختيار التوصيل بطريقة "courier"
  @IsOptional()
  @IsEnum(CourierProvider, { message: 'شركة الشحن غير صحيحة' })
  courierProvider?: CourierProvider;

  // طريقة تنفيذ التوصيل: شركة شحن خارجية (افتراضي) أو مندوب المحل — إلزامية فقط عند التوصيل
  @IsOptional()
  @IsEnum(DeliveryMethod, { message: 'طريقة التوصيل غير صحيحة' })
  deliveryMethod?: DeliveryMethod;

  // الفرع الذي اختاره المستهلك للتسوق منه — إلزامي فقط لو المحل عنده أكثر من فرع
  @IsOptional()
  @IsString()
  branchId?: string;

  // كود كوبون الخصم (اختياري) — يُطبّق على إجمالي المنتجات فقط، لا على رسوم التوصيل
  @IsOptional()
  @IsString()
  couponCode?: string;
}
