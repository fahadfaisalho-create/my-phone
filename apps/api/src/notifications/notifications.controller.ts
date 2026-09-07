import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { NotificationsService } from './notifications.service';

// متاحة لأي دور مسجّل دخول (مستهلك، تاجر، حساب فرعي، إدمن) — كل واحد
// يشوف إشعاراته هو فقط (مفلترة بمعرّف المستخدم من التوكن)
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('me')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.listMine(user.id);
  }

  @Get('me/unread-count')
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Patch('me/read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user.id);
  }
}
