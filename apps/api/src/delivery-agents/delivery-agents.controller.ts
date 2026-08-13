import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { DeliveryAgentsService } from './delivery-agents.service';
import { CreateDeliveryAgentDto } from './dto/create-delivery-agent.dto';
import { UpdateDeliveryAgentDto } from './dto/update-delivery-agent.dto';

@Controller('stores/me/delivery-agents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant_rep')
export class DeliveryAgentsController {
  constructor(private readonly deliveryAgentsService: DeliveryAgentsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveryAgentsService.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDeliveryAgentDto) {
    return this.deliveryAgentsService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryAgentDto,
  ) {
    return this.deliveryAgentsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.deliveryAgentsService.remove(user.id, id);
  }
}
