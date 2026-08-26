import { IsNotEmpty, IsString } from 'class-validator';

// تعديل الفرع بعد إنشائه يقتصر على الاسم فقط — الموقع (العنوان/الإحداثيات) يُقفل نهائياً
// بعد الإنشاء لتفادي تضارب مع حجوزات/طلبات سابقة مرتبطة بموقع الفرع الأصلي
export class RenameBranchDto {
  @IsString()
  @IsNotEmpty({ message: 'اسم الفرع مطلوب' })
  name: string;
}
