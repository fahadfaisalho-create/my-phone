import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('consumer')
export class MyReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('me')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.reviewsService.listMine(user.id);
  }
}
