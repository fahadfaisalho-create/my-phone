import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// نموذج تعديل بيانات المنتج (بدون الكمية — لها endpoint مخصص في المخزون)
export class UpdateProductDto extends PartialType(OmitType(CreateProductDto, ['quantity'] as const)) {}
