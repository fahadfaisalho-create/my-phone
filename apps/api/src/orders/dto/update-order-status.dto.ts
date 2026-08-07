import { IsIn } from 'class-validator';

const ALLOWED = ['processing', 'completed', 'cancelled'] as const;

export class UpdateOrderStatusDto {
  @IsIn(ALLOWED, { message: `الحالة يجب أن تكون إحدى: ${ALLOWED.join(', ')}` })
  status: (typeof ALLOWED)[number];
}
