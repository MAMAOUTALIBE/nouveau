import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Renderer2 } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Login } from './login';
import { AuthError, AuthService } from '../../shared/services/auth.service';
import { NavService } from '../../shared/services/nav.service';

/**
 * Tests classe-level pour `Login` — la stack vitest courante ne resout pas les
 * `templateUrl/styleUrls` (cf. service-unavailable-page.spec.ts qui suit la
 * meme convention). On exerce donc le composant via son API publique
 * (`loginForm`, `submit()`, etc.) avec des stubs Auth/Nav/Toastr/Renderer2.
 */

class ToastrStub {
  success = vi.fn();
  error = vi.fn();
  warning = vi.fn();
  info = vi.fn();
}

class AuthServiceStub {
  showLoader = false;
  loginWithEmail = vi.fn();
}

class NavServiceStub {
  getDefaultPath = vi.fn(() => '/dashboard');
}

class Renderer2Stub {
  selectRootElement = vi.fn(() => document.body);
  setAttribute = vi.fn();
  removeAttribute = vi.fn();
}

describe('Login component', () => {
  let component: Login;
  let authService: AuthServiceStub;
  let navService: NavServiceStub;
  let toastr: ToastrStub;
  let router: Router;

  beforeEach(() => {
    authService = new AuthServiceStub();
    navService = new NavServiceStub();
    toastr = new ToastrStub();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: NavService, useValue: navService },
        { provide: ToastrService, useValue: toastr },
        { provide: Renderer2, useClass: Renderer2Stub },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component = TestBed.runInInjectionContext(() => new Login());
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
    document.body.removeAttribute('class');
  });

  it('initializes a form with required+email validators on username and required on password', () => {
    // Champs présents, vides et invalides au démarrage : le bouton « Se
    // connecter » est désactivé tant que le form est invalide ou que le
    // loader est actif (voir test plus bas).
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.controls['username']).toBeDefined();
    expect(component.loginForm.controls['password']).toBeDefined();
    expect(component.loginForm.controls['username'].value).toBe('');
    expect(component.loginForm.controls['password'].value).toBe('');
    expect(component.loginForm.valid).toBe(false);
  });

  it('keeps the form invalid when the email is malformed', () => {
    component.loginForm.controls['username'].setValue('not-an-email');
    component.loginForm.controls['password'].setValue('secret-pass');

    expect(component.loginForm.controls['username'].hasError('email')).toBe(true);
    expect(component.loginForm.valid).toBe(false);
  });

  it('calls AuthService.loginWithEmail and navigates to the default path on success', async () => {
    authService.loginWithEmail.mockResolvedValue({ token: '' });
    component.loginForm.controls['username'].setValue('alice@gov.gn');
    component.loginForm.controls['password'].setValue('password123');

    component.submit();
    // Laisse la chaîne loginWithEmail().then(...) résoudre.
    await Promise.resolve();
    await Promise.resolve();

    expect(authService.loginWithEmail).toHaveBeenCalledWith('alice@gov.gn', 'password123');
    expect(navService.getDefaultPath).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(toastr.success).toHaveBeenCalled();
  });

  it('shows the anti-enumeration error message on invalid credentials', async () => {
    authService.loginWithEmail.mockRejectedValue(
      new AuthError('INVALID_CREDENTIALS', 'Identifiants invalides')
    );
    component.loginForm.controls['username'].setValue('inconnu@gov.gn');
    component.loginForm.controls['password'].setValue('wrong-password');

    component.submit();
    await Promise.resolve();
    await Promise.resolve();

    // Le toast porte le même message qu'en cas d'email inexistant —
    // anti-énumération côté UI.
    expect(toastr.error).toHaveBeenCalled();
    const [message] = toastr.error.mock.calls.at(-1) ?? [];
    expect(message).toBe('Identifiants invalides');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('rejects a too-short password client-side before calling the API', () => {
    component.loginForm.controls['username'].setValue('alice@gov.gn');
    // Form Validators.required passe avec 'abc', mais validateForm() coupe
    // les mots de passe < 6 caractères : on n'appelle jamais l'API et un
    // toast d'erreur est affiché.
    component.loginForm.controls['password'].setValue('abc');

    component.submit();

    expect(authService.loginWithEmail).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('6 caractères');
    expect(toastr.error).toHaveBeenCalled();
  });

  it('toggles the password visibility flag and icon', () => {
    expect(component.showPassword).toBe(false);
    expect(component.passwordToggleIcon).toBe('fe fe-eye-off');

    component.togglePasswordVisibility();

    expect(component.showPassword).toBe(true);
    expect(component.passwordToggleIcon).toBe('fe fe-eye');
  });
});
