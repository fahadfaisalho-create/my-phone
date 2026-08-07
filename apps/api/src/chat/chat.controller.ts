import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chats')
  @Roles('consumer')
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateChatDto) {
    return this.chatService.startOrGetChat(user.id, dto.storeId);
  }

  @Get('chats/me')
  @Roles('consumer')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.listMineAsConsumer(user.id);
  }

  @Get('stores/me/chats')
  @Roles('merchant_rep')
  listForMyStore(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.listMineAsMerchant(user.id);
  }

  @Get('chats/:id/messages')
  @Roles('consumer', 'merchant_rep')
  listMessages(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.chatService.listMessages(id, this.participantOpts(user));
  }

  @Post('chats/:id/messages')
  @Roles('consumer', 'merchant_rep')
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const senderType = user.role === 'consumer' ? 'consumer' : 'merchant';
    return this.chatService.sendMessage(id, senderType, user.id, dto, this.participantOpts(user));
  }

  private participantOpts(user: AuthenticatedUser) {
    return user.role === 'consumer'
      ? { consumerId: user.id }
      : { merchantOwnerUserId: user.id };
  }
}
