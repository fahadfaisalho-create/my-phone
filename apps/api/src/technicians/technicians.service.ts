import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { CreateCertificateDto } from './dto/create-certificate.dto';

@Injectable()
export class TechniciansService {
  constructor(private readonly prisma: PrismaService) {}

  list(storeId: string) {
    return this.prisma.technician.findMany({
      where: { storeId },
      orderBy: { createdAt: 'asc' },
      include: { certificates: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async listMine(ownerUserId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.list(store.id);
  }

  async create(
    ownerUserId: string,
    dto: CreateTechnicianDto,
    files: { photo?: Express.Multer.File[]; freelanceLicenseFile?: Express.Multer.File[] },
  ) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const photo = files.photo?.[0];
    const licenseFile = files.freelanceLicenseFile?.[0];
    return this.prisma.technician.create({
      data: {
        storeId: store.id,
        name: dto.name,
        nationality: dto.nationality,
        experienceYears: dto.experienceYears,
        freelanceLicenseNo: dto.freelanceLicenseNo,
        photoUrl: photo ? `/uploads/technicians/${photo.filename}` : null,
        freelanceLicenseFileUrl: licenseFile ? `/uploads/licenses/${licenseFile.filename}` : null,
      },
      include: { certificates: true },
    });
  }

  private async findOwned(ownerUserId: string, technicianId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const technician = await this.prisma.technician.findUnique({ where: { id: technicianId } });
    if (!technician || technician.storeId !== store.id) {
      throw new NotFoundException('الموظف غير موجود');
    }
    return technician;
  }

  async update(
    ownerUserId: string,
    technicianId: string,
    dto: UpdateTechnicianDto,
    files: { photo?: Express.Multer.File[]; freelanceLicenseFile?: Express.Multer.File[] },
  ) {
    const technician = await this.findOwned(ownerUserId, technicianId);
    const photo = files.photo?.[0];
    const licenseFile = files.freelanceLicenseFile?.[0];
    return this.prisma.technician.update({
      where: { id: technicianId },
      data: {
        name: dto.name ?? technician.name,
        nationality: dto.nationality ?? technician.nationality,
        experienceYears: dto.experienceYears ?? technician.experienceYears,
        freelanceLicenseNo: dto.freelanceLicenseNo ?? technician.freelanceLicenseNo,
        photoUrl: photo ? `/uploads/technicians/${photo.filename}` : technician.photoUrl,
        freelanceLicenseFileUrl: licenseFile
          ? `/uploads/licenses/${licenseFile.filename}`
          : technician.freelanceLicenseFileUrl,
      },
      include: { certificates: true },
    });
  }

  async remove(ownerUserId: string, technicianId: string) {
    await this.findOwned(ownerUserId, technicianId);
    await this.prisma.technician.delete({ where: { id: technicianId } });
    return { success: true };
  }

  async addCertificate(
    ownerUserId: string,
    technicianId: string,
    dto: CreateCertificateDto,
    file?: Express.Multer.File,
  ) {
    await this.findOwned(ownerUserId, technicianId);
    return this.prisma.technicianCertificate.create({
      data: {
        technicianId,
        title: dto.title,
        fileUrl: file ? `/uploads/certificates/${file.filename}` : null,
      },
    });
  }

  async removeCertificate(ownerUserId: string, technicianId: string, certificateId: string) {
    await this.findOwned(ownerUserId, technicianId);
    const cert = await this.prisma.technicianCertificate.findUnique({ where: { id: certificateId } });
    if (!cert || cert.technicianId !== technicianId) {
      throw new NotFoundException('الشهادة غير موجودة');
    }
    await this.prisma.technicianCertificate.delete({ where: { id: certificateId } });
    return { success: true };
  }
}
