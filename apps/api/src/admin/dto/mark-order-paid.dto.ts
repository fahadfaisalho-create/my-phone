import { IsBoolean } from 'class-validator';

export class MarkOrderPaidDto {
  @IsBoolean({ message: 'قيمة الدفع يجب أن تكون true أو false' })
  paid: boolean;
}
