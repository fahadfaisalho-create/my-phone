import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TicketRelatedType, TicketStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SectionGuard } from '../auth/guards/section.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireSection } from '../auth/decorators/require-section.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { SupportTicketsService } from './support-tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

@Controller('support-tickets')
@UseGuards(JwtAuthGuard, RolesGuard, SectionGuard)
export class SupportTicketsController {
  constructor(private readonly ticketsService: SupportTicketsService) {}

  @Post()
  @Roles('consumer', 'merchant_rep', 'employee')
  @RequireSection('support')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTicketDto) {
    return user.role === 'consumer'
      ? this.ticketsService.createAsConsumer(user.id, dto)
      : this.ticketsService.createAsMerchant(user.id, dto);
  }

  @Get('me')
  @Roles('consumer', 'merchant_rep', 'employee')
  @RequireSection('support')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return user.role === 'consumer'
      ? this.ticketsService.listMineAsConsumer(user.id)
      : this.ticketsService.listMineAsMerchant(user.id);
  }

  @Get()
  @Roles('admin')
  list(@Query('status') status?: TicketStatus, @Query('relatedType') relatedType?: TicketRelatedType) {
    return this.ticketsService.list(status, relatedType);
  }

  @Patch(':id/status')
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.ticketsService.updateStatus(id, dto.status);
  }
}
