import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SectionGuard } from '../auth/guards/section.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireSection } from '../auth/decorators/require-section.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { registrationFilesStorage, fileFilter, MAX_FILE_SIZE_BYTES } from '../common/multer.config';

const chatImageInterceptor = FileInterceptor('chatImage', {
  storage: registrationFilesStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, SectionGuard)
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
  @Roles('merchant_rep', 'employee')
  @RequireSection('messages')
  listForMyStore(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.listMineAsMerchant(user.id);
  }

  @Get('chats/:id/messages')
  @Roles('consumer', 'merchant_rep', 'employee')
  @RequireSection('messages')
  listMessages(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.chatService.listMessages(id, this.participantOpts(user));
  }

  @Post('chats/:id/messages')
  @Roles('consumer', 'merchant_rep', 'employee')
  @RequireSection('messages')
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const senderType = user.role === 'consumer' ? 'consumer' : 'merchant';
    return this.chatService.sendMessage(id, senderType, user.id, dto, this.participantOpts(user));
  }

  // يرفع صورة قبل إرسالها كرسالة: يرجع imageUrl يُمرَّر بعدها لـ sendMessage (REST أو Socket)
  @Post('chats/:id/upload-image')
  @Roles('consumer', 'merchant_rep')
  @UseInterceptors(chatImageInterceptor)
  async uploadImage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (!image) throw new BadRequestException('لم يتم إرفاق صورة');
    await this.chatService.assertParticipant(id, this.participantOpts(user));
    return { imageUrl: `/uploads/chat/${image.filename}` };
  }

  private participantOpts(user: AuthenticatedUser) {
    return user.role === 'consumer'
      ? { consumerId: user.id }
      : { merchantOwnerUserId: user.id };
  }
}
