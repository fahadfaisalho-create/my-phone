import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude } from 'class-validator';

export class CheckInOutDto {
  @Type(() => Number)
  @IsLatitude({ message: 'إحداثية خط العرض غير صحيحة' })
  lat: number;

  @Type(() => Number)
  @IsLongitude({ message: 'إحداثية خط الطول غير صحيحة' })
  lng: number;
}
