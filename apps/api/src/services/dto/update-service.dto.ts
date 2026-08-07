import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto';

// الاسم لا يُعدَّل بعد الإنشاء — كل خدمة تُعدَّل بشكل مستقل عبر بقية الحقول
export class UpdateServiceDto extends PartialType(OmitType(CreateServiceDto, ['name'] as const)) {}
