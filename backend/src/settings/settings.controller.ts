import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { PublicSiteSettings, toPublicSettings } from './site-settings.entity';
import { SettingsService } from './settings.service';

@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('settings')
  async read(): Promise<PublicSiteSettings> {
    return toPublicSettings(await this.settings.get());
  }

  @Put('admin/settings')
  @UseGuards(AccessTokenGuard, AdminGuard)
  async update(@Body() dto: UpdateSettingsDto): Promise<PublicSiteSettings> {
    return toPublicSettings(await this.settings.update(dto));
  }
}
