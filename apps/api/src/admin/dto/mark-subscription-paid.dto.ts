import { IsBoolean } from 'class-validator';

export class MarkSubscriptionPaidDto {
  @IsBoolean({ message: 'قيمة الدفع يجب أن تكون true أو false' })
  paid: boolean;
}
