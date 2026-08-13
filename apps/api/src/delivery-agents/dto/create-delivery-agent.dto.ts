import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDeliveryAgentDto {
  @IsString()
  @IsNotEmpty({ message: 'اسم المندوب مطلوب' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'رقم جوال المندوب مطلوب' })
  phone: string;
}
