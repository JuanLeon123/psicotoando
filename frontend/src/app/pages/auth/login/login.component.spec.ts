import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';
import { authResponse } from '../../../core/auth/testing';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let element: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    element = fixture.nativeElement;
    document.body.appendChild(element);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/auth/providers').flush({ google: null });
    fixture.detectChanges();
  });

  afterEach(() => {
    element.remove();
    http.verify();
  });

  function type(id: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submit(): void {
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
  }

  it('hides the Google option when no provider is configured', () => {
    expect(element.querySelector('.divider')).toBeNull();
    expect(element.querySelector('.google-button')).toBeNull();
  });

  it('shows field errors and focuses the first invalid field', () => {
    type('login-email', 'ana@');
    submit();
    const email = element.querySelector<HTMLInputElement>('#login-email')!;
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe('login-email-error');
    expect(element.querySelector('#login-email-error')?.textContent).toContain(
      'correo electrónico válido',
    );
    expect(
      element.querySelector('#login-password-error')?.textContent,
    ).toContain('obligatorio');
    expect(document.activeElement).toBe(email);
  });

  it('shows the API error message when the credentials are wrong', () => {
    type('login-email', 'ana@example.com');
    type('login-password', 'incorrecta1');
    submit();
    http.expectOne('/api/auth/login').flush(
      {
        statusCode: 401,
        message: 'Correo o contraseña incorrectos.',
        error: 'Unauthorized',
      },
      { status: 401, statusText: 'Unauthorized' },
    );
    fixture.detectChanges();
    expect(element.querySelector('.form-alert--error')?.textContent).toContain(
      'Correo o contraseña incorrectos.',
    );
  });

  it('goes to the account page after signing in', () => {
    const navigate = spyOn(
      TestBed.inject(Router),
      'navigateByUrl',
    ).and.resolveTo(true);
    type('login-email', 'ana@example.com');
    type('login-password', 'secreto123');
    submit();
    http.expectOne('/api/auth/login').flush(authResponse());
    expect(navigate).toHaveBeenCalledWith('/mi-cuenta');
  });
});
