import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { CreateLeaveRequestPayload, LeaveRequest, LeaveService } from '../leave/leave.service';

@Component({
  selector: 'app-agent-portal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './agent-portal.html',
})
export class AgentPortalPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private leaveService = inject(LeaveService);
  private toastr = inject(ToastrService);

  showCreateForm = false;
  isLoadingRequests = false;
  submitting = false;
  recentRequests: LeaveRequest[] = [];

  quick = [
    { label: 'Demander une absence', desc: 'Conges, missions, maladie', cta: 'Ouvrir' },
    { label: 'Consulter mes bulletins', desc: 'Documents administratifs', cta: 'Voir' },
    { label: 'Mettre a jour mon profil', desc: 'Coordonnees, situation', cta: 'Mettre a jour' },
  ];

  form = this.fb.group({
    reference: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    agent: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    type: ['Conge annuel', [Validators.required]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    status: ['En attente', [Validators.required]],
  });

  ngOnInit(): void {
    this.resetForm();
    this.loadRecentRequests();
  }

  fieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['pattern']) return 'Format invalide (A-Z, 0-9, -)';
    return 'Valeur invalide';
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.resetForm();
  }

  saveRequest(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const startDate = this.form.value.startDate || '';
    const endDate = this.form.value.endDate || '';
    const startTimestamp = Date.parse(startDate);
    const endTimestamp = Date.parse(endDate);
    if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp) || endTimestamp < startTimestamp) {
      this.toastr.error('La date de fin doit etre superieure ou egale a la date de debut', 'Portail agent', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreateLeaveRequestPayload = {
      reference: this.form.value.reference?.trim() || undefined,
      agent: this.form.value.agent?.trim() || '',
      type: this.form.value.type?.trim() || '',
      startDate,
      endDate,
      status: this.form.value.status?.trim() || 'En attente',
    };

    this.submitting = true;
    this.leaveService
      .createRequest(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Demande enregistree avec succes', 'Portail agent', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadRecentRequests();
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastr.error('Operation impossible pour le moment', 'Portail agent', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadRecentRequests(): void {
    this.isLoadingRequests = true;
    this.leaveService
      .getRequests({
        page: 1,
        limit: 5,
        sortBy: 'startDate',
        sortOrder: 'desc',
      })
      .pipe(finalize(() => (this.isLoadingRequests = false)))
      .subscribe({
        next: (items) => {
          this.recentRequests = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.recentRequests = [];
          this.cdr.detectChanges();
        },
      });
  }

  private resetForm(): void {
    this.form.reset({
      reference: '',
      agent: this.inferAgentLabel(),
      type: 'Conge annuel',
      startDate: '',
      endDate: '',
      status: 'En attente',
    });
  }

  private inferAgentLabel(): string {
    const username = String(localStorage.getItem('rh_username') || '').trim().toLowerCase();
    if (!username) {
      return '';
    }

    const localPart = username.split('@')[0] || username;
    const words = localPart
      .split(/[._-]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 0)
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`);

    return words.join(' ');
  }
}
