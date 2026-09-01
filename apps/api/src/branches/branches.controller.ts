import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SectionGuard } from '../auth/guards/section.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireSection } from '../auth/decorators/require-section.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { RenameBranchDto } from './dto/rename-branch.dto';

@Controller('stores/me/branches')
@UseGuards(JwtAuthGuard, RolesGuard, SectionGuard)
@Roles('merchant_rep', 'employee')
@RequireSection('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.branchesService.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBranchDto) {
    return this.branchesService.create(user.id, dto);
  }

  // تعديل الفرع بعد الإنشاء يقتصر على الاسم فقط — الموقع مقفل نهائياً
  @Patch(':id')
  rename(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RenameBranchDto,
  ) {
    return this.branchesService.rename(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.branchesService.remove(user.id, id);
  }
}
