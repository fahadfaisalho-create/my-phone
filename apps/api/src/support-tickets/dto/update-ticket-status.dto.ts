import { IsIn } from 'class-validator';

const ALLOWED = ['open', 'in_progress', 'closed'] as const;

export class UpdateTicketStatusDto {
  @IsIn(ALLOWED, { message: `الحالة يجب أن تكون إحدى: ${ALLOWED.join(', ')}` })
  status: (typeof ALLOWED)[number];
}
