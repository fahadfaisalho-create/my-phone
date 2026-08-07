import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

// صفحة المخزون منفصلة عن نموذج المنتج — تعدّل الكمية فقط.
// إمّا فرق (delta: زيادة/نقصان كأزرار +/-) أو قيمة مطلقة (quantity) — يُرسل أحدهما.
export class UpdateInventoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  delta?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  quantity?: number;
}
