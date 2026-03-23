import { Component, Renderer2, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { AuthError, AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterModule, FormsModule, ReactiveFormsModule, NgbModule, ToastrModule],
  providers: [{ provide: ToastrService, useClass: ToastrService }],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'] // Corrected to 'styleUrls'
})
export class Login {
  authservice = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private renderer = inject(Renderer2);
  private toastr = inject(ToastrService);

  disabled = '';
  active!: 2;
  showLoader: boolean | undefined;
  // public showPassword = false;
  public angularLoginForm!: FormGroup;
  public firebaseLoginForm!: FormGroup;

  email = 'spruko@admin.com';
  password = 'sprukoadmin';
  errorMessage = ''; // validation error handle
  _error: { name: string; message: string } = { name: '', message: '' }; // for firebase error handle
  public loginForm!: FormGroup;
  public error: any = '';

  constructor() {
    const bodyElement = this.renderer.selectRootElement('body', true);
    this.renderer.setAttribute(bodyElement, 'class', 'error-page1 bg-primary');
  }

  ngOnInit(): void {
    this.angularLoginForm = this.formBuilder.group({
      username: ['spruko@admin.com', [Validators.required, Validators.email]],
      password: ['sprukoadmin', Validators.required]
    });

    this.firebaseLoginForm = this.formBuilder.group({
      username: ['spruko@admin.com', [Validators.required, Validators.email]],
      password: ['sprukoadmin', Validators.required]
    });
  }

  clearErrorMessage() {
    this.errorMessage = '';
    this._error = { name: '', message: '' };
  }
  login() {
    this.clearErrorMessage();
    const email = this.firebaseLoginForm.controls['username'].value;
    const password = this.firebaseLoginForm.controls['password'].value;

    if (this.validateForm(email, password)) {
      this.authenticate(email, password);

    } else {
      this.toastr.error('Identifiants invalides', 'Primature RH', {
        timeOut: 3000,
        positionClass: 'toast-top-right'
      });
    }
  }


  validateForm(email: string, password: string) {
    if (email.length === 0) {
      this.errorMessage = 'Please enter email id';
      return false;
    }

    if (password.length === 0) {
      this.errorMessage = 'Please enter password';
      return false;
    }

    if (password.length < 6) {
      this.errorMessage = 'Password should be at least 6 characters';
      return false;
    }

    this.errorMessage = '';
    return true;
  }

  get form() {
    return this.loginForm.controls;
  }

  Submit() {
    const { username, password } = this.angularLoginForm.controls;
    if (!this.validateForm(username.value, password.value)) {
      this.toastr.error('Identifiants invalides', 'Primature RH', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
      return;
    }
    this.authenticate(username.value, password.value);

  }


  ngOnDestroy(): void {
    const bodyElement = this.renderer.selectRootElement('body', true);
    this.renderer.removeAttribute(bodyElement, 'class');
  }
  public visibilityMap: Record<string, boolean> = {
    Angular: false,
    Firebase: false
  };
  public iconMap: Record<string, string> = {
    Angular: 'fe fe-eye-off',
    Firebase: 'fe fe-eye-off'
  };
  showPassword = false;
  toggleClass = "ri-eye-off-line";
  toggleVisibility(tab: string): void {
    this.visibilityMap[tab] = !this.visibilityMap[tab];
    this.iconMap[tab] = this.visibilityMap[tab] ? 'fe fe-eye' : 'fe fe-eye-off';
  }

  private authenticate(email: string, password: string): void {
    this.authservice
      .loginWithEmail(email, password)
      .then(() => {
        this.router.navigate(['/dashboard']);
        this.toastr.success('Connexion réussie', 'Primature RH', {
          timeOut: 3000,
          positionClass: 'toast-top-right',
        });
      })
      .catch((error: any) => {
        this._error = error;
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
          return "Serveur d'authentification indisponible. Mode dev: utilisez spruko@admin.com / sprukoadmin.";
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


