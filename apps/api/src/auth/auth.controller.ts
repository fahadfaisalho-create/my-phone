import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService, UploadedFiles as UploadedFilesType } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { registrationFilesStorage, fileFilter, MAX_FILE_SIZE_BYTES } from '../common/multer.config';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // تسجيل دخول موحّد للتاجر (merchant_rep) والإدارة (admin) بالبريد وكلمة السر
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // تسجيل محل جديد: بيانات الممثل + بيانات المحل + الملفات الإجبارية + الباقة
  @Post('register-merchant')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'crFile', maxCount: 1 },
        { name: 'bankFile', maxCount: 1 },
      ],
      {
        storage: registrationFilesStorage,
        fileFilter,
        limits: { fileSize: MAX_FILE_SIZE_BYTES },
      },
    ),
  )
  registerMerchant(
    @Body() dto: RegisterMerchantDto,
    @UploadedFiles() files: UploadedFilesType,
  ) {
    return this.authService.registerMerchant(dto, files);
  }

  // استعادة كلمة السر (تاجر/إدمن): يرسل رمز بالبريد إن وُجد الحساب
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
