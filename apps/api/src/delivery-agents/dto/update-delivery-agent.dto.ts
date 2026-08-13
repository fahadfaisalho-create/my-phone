import { IsBoolean, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateDeliveryAgentDto } from './create-delivery-agent.dto';

export class UpdateDeliveryAgentDto extends PartialType(CreateDeliveryAgentDto) {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
