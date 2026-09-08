import { IsNotEmpty, IsString } from 'class-validator';

// الكود اللي يطلبه مندوب المحل من المستهلك وقت التسليم — إثبات التوصيل
// الوحيد المقبول لإكمال طلب توصيل مندوب المحل (راجع OrdersService.confirmAgentDelivery)
export class ConfirmDeliveryDto {
  @IsString()
  @IsNotEmpty({ message: 'كود التسليم مطلوب' })
  code: string;
}
