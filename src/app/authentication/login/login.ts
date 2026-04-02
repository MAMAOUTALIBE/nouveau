import { Component, OnDestroy, OnInit, Renderer2, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthError, AuthService } from '../../shared/services/auth.service';
import { NavService } from '../../shared/services/nav.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [RouterModule, ReactiveFormsModule],
  providers: [{ provide: ToastrService, useClass: ToastrService }],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements OnInit, OnDestroy {
  readonly authservice = inject(AuthService);
  private readonly navService = inject(NavService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly renderer = inject(Renderer2);
  private readonly toastr = inject(ToastrService);
  readonly showDevCredentialsHint = !!environment.auth?.devFallback?.enabled;
  readonly supportContact = 'administration RH';

  loginForm!: FormGroup;
  errorMessage = '';
  authError: { name: string; message: string } = { name: '', message: '' };
  showPassword = false;

  constructor() {
    const bodyElement = this.renderer.selectRootElement('body', true);
    this.renderer.setAttribute(bodyElement, 'class', 'error-page1 bg-primary');
  }

  ngOnInit(): void {
    const defaultUsername = this.showDevCredentialsHint
      ? environment.auth?.devFallback?.username || ''
      : '';
    const defaultPassword = this.showDevCredentialsHint
      ? environment.auth?.devFallback?.password || ''
      : '';

    this.loginForm = this.formBuilder.group({
      username: [defaultUsername, [Validators.required, Validators.email]],
      password: [defaultPassword, Validators.required],
    });
  }

  ngOnDestroy(): void {
    const bodyElement = this.renderer.selectRootElement('body', true);
    this.renderer.removeAttribute(bodyElement, 'class');
  }

  submit(): void {
    this.clearErrorMessage();
    const email = String(this.loginForm.controls['username'].value || '').trim();
    const password = String(this.loginForm.controls['password'].value || '');

    if (this.validateForm(email, password)) {
      this.authenticate(email, password);
    } else {
      this.toastr.error('Identifiants invalides', 'Primature RH', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
    }
  }

  clearErrorMessage(): void {
    this.errorMessage = '';
    this.authError = { name: '', message: '' };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get passwordToggleIcon(): string {
    return this.showPassword ? 'fe fe-eye' : 'fe fe-eye-off';
  }

  validateForm(email: string, password: string): boolean {
    if (email.length === 0) {
      this.errorMessage = 'Veuillez saisir une adresse e-mail.';
      return false;
    }

    if (password.length === 0) {
      this.errorMessage = 'Veuillez saisir votre mot de passe.';
      return false;
    }

    if (password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
      return false;
    }

    this.errorMessage = '';
    return true;
  }

  private authenticate(email: string, password: string): void {
    this.authservice
      .loginWithEmail(email, password)
      .then(() => {
        this.router.navigateByUrl(this.navService.getDefaultPath());
        this.toastr.success('Connexion réussie', 'Primature RH', {
          timeOut: 3000,
          positionClass: 'toast-top-right',
        });
      })
      .catch((error: any) => {
        this.authError = error;
        this.toastr.error(this.resolveAuthErrorMessage(error), 'Primature RH', {
          timeOut: 3000,
          positionClass: 'toast-top-right',
        });
      });
  }

  private resolveAuthErrorMessage(error: unknown): string {
    if (error instanceof AuthError) {
      switch (error.code) {
        case 'API_UNREACHABLE':
          return this.showDevCredentialsHint
            ? "Serveur d'authentification indisponible. Mode dev: utilisez les identifiants de démonstration affichés."
            : "Serveur d'authentification indisponible. Contactez l'administration RH.";
        case 'INVALID_CREDENTIALS':
          return 'Identifiants invalides';
        case 'INVALID_AUTH_RESPONSE':
          return "Réponse d'authentification invalide";
        case 'AUTH_SERVER_ERROR':
        default:
          return error.message || "Erreur serveur d'authentification";
      }
    }

    return 'Identifiants invalides';
  }
}
