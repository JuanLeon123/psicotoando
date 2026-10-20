import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Fila única (id = 1) con los datos de contacto y redes del sitio. */
@Entity({ name: 'site_settings' })
export class SiteSettings {
  @PrimaryColumn({ type: 'smallint', default: 1 })
  id!: number;

  /** Número en formato internacional sin «+», p. ej. 573001234567. */
  @Column({
    name: 'whatsapp_number',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  whatsappNumber!: string | null;

  @Column({
    name: 'contact_email',
    type: 'varchar',
    length: 254,
    nullable: true,
  })
  contactEmail!: string | null;

  @Column({
    name: 'instagram_url',
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  instagramUrl!: string | null;

  @Column({
    name: 'facebook_url',
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  facebookUrl!: string | null;

  /** Valor fijo del envío en pesos. 0 = envío gratis. */
  @Column({ name: 'shipping_flat_cop', type: 'integer', default: 0 })
  shippingFlatCop!: number;

  /** Subtotal desde el que el envío es gratis. Null = sin umbral. */
  @Column({ name: 'free_shipping_from_cop', type: 'integer', nullable: true })
  freeShippingFromCop!: number | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

export interface PublicSiteSettings {
  readonly whatsappNumber: string | null;
  readonly contactEmail: string | null;
  readonly instagramUrl: string | null;
  readonly facebookUrl: string | null;
  readonly shippingFlatCop: number;
  readonly freeShippingFromCop: number | null;
}

export function toPublicSettings(settings: SiteSettings): PublicSiteSettings {
  return {
    whatsappNumber: settings.whatsappNumber,
    contactEmail: settings.contactEmail,
    instagramUrl: settings.instagramUrl,
    facebookUrl: settings.facebookUrl,
    shippingFlatCop: settings.shippingFlatCop,
    freeShippingFromCop: settings.freeShippingFromCop,
  };
}

/** Costo del envío para un subtotal, según los ajustes del sitio. */
export function shippingFor(
  settings: Pick<SiteSettings, 'shippingFlatCop' | 'freeShippingFromCop'>,
  subtotalCop: number,
): number {
  if (
    settings.freeShippingFromCop !== null &&
    subtotalCop >= settings.freeShippingFromCop
  ) {
    return 0;
  }
  return settings.shippingFlatCop;
}
