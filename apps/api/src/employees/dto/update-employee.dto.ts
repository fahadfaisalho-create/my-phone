import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

// نفس حقول الإنشاء (اختيارية كلها للتعديل الجزئي)، بدون البريد الإلكتروني —
// البريد هو معرّف الدخول ولا يتغيّر بعد الإنشاء
export class UpdateEmployeeDto extends PartialType(OmitType(CreateEmployeeDto, ['email'] as const)) {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
