import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { definedOnly } from '../common/defined-only';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SiteSettings } from './site-settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SiteSettings)
    private readonly settings: Repository<SiteSettings>,
  ) {}

  /** La fila la crea la migración; si faltara, se recrea vacía. */
  async get(): Promise<SiteSettings> {
    return (
      (await this.settings.findOneBy({ id: 1 })) ??
      this.settings.save(this.settings.create({ id: 1 }))
    );
  }

  async update(dto: UpdateSettingsDto): Promise<SiteSettings> {
    const current = await this.get();
    Object.assign(current, definedOnly(dto));
    return this.settings.save(current);
  }
}
