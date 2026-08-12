import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCertificateDto {
  @IsString()
  @IsNotEmpty({ message: 'عنوان الشهادة مطلوب' })
  title: string;
}
