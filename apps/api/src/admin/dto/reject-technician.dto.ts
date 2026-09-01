import { IsNotEmpty, IsString } from 'class-validator';

export class RejectTechnicianDto {
  @IsString()
  @IsNotEmpty({ message: 'سبب الرفض مطلوب' })
  reason: string;
}
