import { IsIn } from 'class-validator';

const ALLOWED = ['accepted', 'completed', 'cancelled'] as const;

export class UpdateBookingStatusDto {
  @IsIn(ALLOWED, { message: `الحالة يجب أن تكون إحدى: ${ALLOWED.join(', ')}` })
  status: (typeof ALLOWED)[number];
}
