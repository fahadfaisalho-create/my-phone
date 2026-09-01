import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SectionGuard } from '../auth/guards/section.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireSection } from '../auth/decorators/require-section.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, SectionGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // --- المستهلك ---
  @Post('bookings')
  @Roles('consumer')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get('bookings/me')
  @Roles('consumer')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingsService.listMine(user.id);
  }

  @Patch('bookings/:id/cancel')
  @Roles('consumer')
  cancelMine(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bookingsService.cancelMine(user.id, id);
  }

  // --- التاجر ---
  @Get('stores/me/bookings')
  @Roles('merchant_rep', 'employee')
  @RequireSection('bookings')
  listForMyStore(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingsService.listForMyStore(user.id);
  }

  @Patch('stores/me/bookings/:id/status')
  @Roles('merchant_rep', 'employee')
  @RequireSection('bookings')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(user.id, id, dto.status);
  }
}
