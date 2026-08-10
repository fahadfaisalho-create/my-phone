import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { MyReviewsController } from './my-reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [ReviewsController, MyReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
