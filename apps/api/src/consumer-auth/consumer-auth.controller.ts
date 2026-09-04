import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ConsumerAuthService } from './consumer-auth.service';
import { CheckPhoneDto } from './dto/check-phone.dto';
import { RegisterConsumerDto } from './dto/register-consumer.dto';
import { ConsumerLoginDto } from './dto/consumer-login.dto';

@Controller('consumer-auth')
export class ConsumerAuthController {
  constructor(private readonly consumerAuthService: ConsumerAuthService) {}

  @Post('check-phone')
  @HttpCode(HttpStatus.OK)
  checkPhone(@Body() dto: CheckPhoneDto) {
    return this.consumerAuthService.checkPhone(dto.phone);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  register(@Body() dto: RegisterConsumerDto) {
    return this.consumerAuthService.register(dto.phone, dto.password, dto.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: ConsumerLoginDto) {
    return this.consumerAuthService.login(dto.phone, dto.password);
  }
}
