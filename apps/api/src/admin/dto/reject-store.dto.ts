import { IsNotEmpty, IsString } from 'class-validator';

export class RejectStoreDto {
  @IsString()
  @IsNotEmpty({ message: 'سبب الرفض مطلوب' })
  reason: string;
}
