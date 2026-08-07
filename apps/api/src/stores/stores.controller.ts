import { Body, Controller, Get, Patch, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { StoresService, UpdateStoreFiles } from './stores.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { registrationFilesStorage, fileFilter, MAX_FILE_SIZE_BYTES } from '../common/multer.config';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('me')
  @Roles('merchant_rep')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.storesService.findMine(user.id);
  }

  @Patch('me')
  @Roles('merchant_rep')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'crFile', maxCount: 1 },
        { name: 'bankFile', maxCount: 1 },
      ],
      { storage: registrationFilesStorage, fileFilter, limits: { fileSize: MAX_FILE_SIZE_BYTES } },
    ),
  )
  updateMine(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStoreDto,
    @UploadedFiles() files: UpdateStoreFiles,
  ) {
    return this.storesService.updateMine(user.id, dto, files);
  }
}
