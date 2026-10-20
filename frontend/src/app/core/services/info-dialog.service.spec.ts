import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SiteSettingsService } from '../settings/site-settings.service';
import { EMPTY_SETTINGS } from '../settings/site-settings.models';
import { InfoDialogService } from './info-dialog.service';

describe('InfoDialogService.openAdvisory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('keeps the pending booking notice while there is no WhatsApp', () => {
    const info = TestBed.inject(InfoDialogService);
    info.openAdvisory();
    expect(info.content()?.action).toBeUndefined();
    expect(info.content()?.items).toContain(
      'El canal de reservas estará disponible próximamente.',
    );
  });

  it('offers a WhatsApp link once a number is configured', () => {
    TestBed.inject(SiteSettingsService).set({
      ...EMPTY_SETTINGS,
      whatsappNumber: '573001234567',
    });
    const info = TestBed.inject(InfoDialogService);
    info.openAdvisory();
    const action = info.content()?.action;
    expect(action?.label).toBe('Escribir por WhatsApp');
    expect(action?.href).toMatch(/^https:\/\/wa\.me\/573001234567\?text=/);
    expect(info.content()?.items).not.toContain(
      'El canal de reservas estará disponible próximamente.',
    );
  });
});
