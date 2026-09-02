import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

// نفس حقول الإنشاء (اختيارية كلها للتعديل الجزئي)، بدون البريد الإلكتروني
// وكلمة السر — البريد معرّف الدخول ولا يتغيّر بعد الإنشاء، وكلمة السر
// تُحدَّد مرة واحدة فقط وقت الإنشاء (لا مسار تعديل لها حالياً)
export class UpdateEmployeeDto extends PartialType(OmitType(CreateEmployeeDto, ['email', 'password'] as const)) {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
