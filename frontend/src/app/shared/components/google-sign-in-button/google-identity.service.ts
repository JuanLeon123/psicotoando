import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export interface GoogleCredentialResponse {
  readonly credential: string;
}

interface GoogleButtonOptions {
  readonly type: 'standard';
  readonly theme: 'outline';
  readonly size: 'large';
  readonly text: 'continue_with' | 'signup_with' | 'signin_with';
  readonly shape: 'pill';
  readonly locale: string;
  readonly width: number;
  readonly logo_alignment: 'center';
}

export interface GoogleIdentity {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: 'popup';
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

/** Loads the Google Identity Services script once, on demand. */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly document = inject(DOCUMENT);
  private loading: Promise<GoogleIdentity> | null = null;

  load(): Promise<GoogleIdentity> {
    const window = this.document.defaultView;
    const existing = window?.google?.accounts?.id;
    if (existing) return Promise.resolve(existing);
    this.loading ??= new Promise<GoogleIdentity>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const identity = window?.google?.accounts?.id;
        if (identity) resolve(identity);
        else reject(new Error('Google Identity Services no está disponible.'));
      };
      script.onerror = () =>
        reject(new Error('No se pudo cargar Google Identity Services.'));
      this.document.head.appendChild(script);
    }).catch((error: unknown) => {
      this.loading = null;
      throw error;
    });
    return this.loading;
  }
}
