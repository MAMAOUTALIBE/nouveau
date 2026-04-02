import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { CreateLeaveBalancePayload, LeaveBalance, LeaveService } from '../../leave.service';

@Component({
  selector: 'app-leave-balances',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './leave-balances.html',
})
export class LeaveBalancesPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private leaveService = inject(LeaveService);
  private toastr = inject(ToastrService);

  balances: LeaveBalance[] = [];
  showCreateForm = false;
  submitting = false;

  form = this.fb.group({
    type: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    allocated: [30, [Validators.required, Validators.min(0), Validators.max(365)]],
    consumed: [0, [Validators.required, Validators.min(0), Validators.max(365)]],
  });

  ngOnInit(): void {
    this.loadBalances();
  }

  percent(allocated: number, consumed: number): number {
    if (!allocated) return 0;
    return Math.round((consumed / allocated) * 100);
  }

  fieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['min']) return `Valeur minimale: ${control.errors['min'].min}`;
    if (control.errors['max']) return `Valeur maximale: ${control.errors['max'].max}`;
    return 'Valeur invalide';
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
    this.cdr.detectChanges();
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.resetForm();
    this.cdr.detectChanges();
  }

  saveBalance(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const allocated = Number(this.form.value.allocated ?? 0);
    const consumed = Number(this.form.value.consumed ?? 0);
    if (consumed > allocated) {
      this.toastr.error('Les jours consommes ne peuvent pas depasser les jours alloues', 'Absences', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreateLeaveBalancePayload = {
      type: this.form.value.type?.trim() || '',
      allocated,
      consumed,
    };

    this.submitting = true;
    this.leaveService
      .createBalance(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Solde mis a jour avec succes', 'Absences', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadBalances();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Absences', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadBalances(): void {
    this.leaveService.getBalances().subscribe({
      next: (items) => {
        this.balances = items;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.balances = [];
        this.toastr.error(this.resolveError(error), 'Absences', {
          timeOut: 3500,
          positionClass: 'toast-top-right',
        });
        this.cdr.detectChanges();
      },
    });
  }

  private resetForm(): void {
    this.form.reset({
      type: '',
      allocated: 30,
      consumed: 0,
    });
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (Array.isArray(error.error?.errors) && error.error.errors.length > 0) {
        return error.error.errors.join(' | ');
      }

      if (typeof error.error?.message === 'string' && error.error.message.trim()) {
        return error.error.message;
      }
    }

    return 'Operation impossible pour le moment';
  }
}
