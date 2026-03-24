import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  CreateDocumentPayload,
  DocumentItem,
  DocumentsService
} from '../../documents.service';

@Component({
  selector: 'app-document-library',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './document-library.html',
})
export class DocumentLibraryPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private documentsService = inject(DocumentsService);
  private toastr = inject(ToastrService);

  items: DocumentItem[] = [];
  showCreateForm = false;
  submitting = false;

  gridConfig = {
    columns: ['Référence', 'Titre', 'Type', 'Propriétaire', 'Mise à jour', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    reference: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(180)]],
    type: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    owner: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    updatedAt: ['', [Validators.required]],
    status: ['Brouillon', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadDocuments();
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
    this.cdr.detectChanges();
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.resetForm();
    this.cdr.detectChanges();
  }

  saveDocument(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const updatedAt = this.form.value.updatedAt || '';
    const parsed = Date.parse(updatedAt);
    if (Number.isNaN(parsed)) {
      this.toastr.error('Date de mise a jour invalide', 'Documents', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreateDocumentPayload = {
      reference: this.form.value.reference?.trim() || undefined,
      title: this.form.value.title?.trim() || '',
      type: this.form.value.type?.trim() || '',
      owner: this.form.value.owner?.trim() || '',
      updatedAt: new Date(parsed).toISOString(),
      status: this.form.value.status?.trim() || 'Brouillon',
    };

    this.submitting = true;
    this.documentsService
      .createDocument(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Document enregistre avec succes', 'Documents', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadDocuments();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Documents', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadDocuments(): void {
    this.documentsService.getDocuments().subscribe({
      next: (items) => {
        this.items = items;
        this.gridConfig = {
          ...this.gridConfig,
          data: items.map((d) => [d.reference, d.title, d.type, d.owner, d.updatedAt, d.status]),
        };
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.items = [];
        this.gridConfig = { ...this.gridConfig, data: [] };
        this.toastr.error(this.resolveError(error), 'Documents', {
          timeOut: 3500,
          positionClass: 'toast-top-right',
        });
        this.cdr.detectChanges();
      },
    });
  }

  private resetForm(): void {
    this.form.reset({
      reference: '',
      title: '',
      type: '',
      owner: '',
      updatedAt: '',
      status: 'Brouillon',
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
