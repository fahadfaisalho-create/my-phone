import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { TechniciansService } from './technicians.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { registrationFilesStorage, fileFilter, MAX_FILE_SIZE_BYTES } from '../common/multer.config';

const technicianFilesInterceptor = FileFieldsInterceptor(
  [
    { name: 'photo', maxCount: 1 },
    { name: 'freelanceLicenseFile', maxCount: 1 },
  ],
  { storage: registrationFilesStorage, fileFilter, limits: { fileSize: MAX_FILE_SIZE_BYTES } },
);

const certificateFileInterceptor = FileInterceptor('certificateFile', {
  storage: registrationFilesStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

interface TechnicianFiles {
  photo?: Express.Multer.File[];
  freelanceLicenseFile?: Express.Multer.File[];
}

@Controller('stores/me/technicians')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant_rep')
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.techniciansService.listMine(user.id);
  }

  @Post()
  @UseInterceptors(technicianFilesInterceptor)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTechnicianDto,
    @UploadedFiles() files: TechnicianFiles,
  ) {
    return this.techniciansService.create(user.id, dto, files);
  }

  @Patch(':id')
  @UseInterceptors(technicianFilesInterceptor)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTechnicianDto,
    @UploadedFiles() files: TechnicianFiles,
  ) {
    return this.techniciansService.update(user.id, id, dto, files);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.techniciansService.remove(user.id, id);
  }

  @Post(':id/certificates')
  @UseInterceptors(certificateFileInterceptor)
  addCertificate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateCertificateDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.techniciansService.addCertificate(user.id, id, dto, file);
  }

  @Delete(':id/certificates/:certId')
  removeCertificate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('certId') certId: string,
  ) {
    return this.techniciansService.removeCertificate(user.id, id, certId);
  }
}
