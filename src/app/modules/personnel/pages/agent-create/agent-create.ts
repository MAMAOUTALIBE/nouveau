import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { CreateAgentPayload, PersonnelService } from '../../personnel.service';

const MATRICULE_PATTERN = /^PRM-\d{4,8}$/;
const PHONE_PATTERN = /^[+\d\s().-]{7,20}$/;
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

const REQUIRED_DOCUMENT_DEFINITIONS = [
  {
    type: "Pièce d'identité (CNI/Passeport)",
    referenceControl: 'identityDocumentRef',
    statusControl: 'identityDocumentStatus',
    fileNameControl: 'identityDocumentFileName',
    fileDataControl: 'identityDocumentFileDataUrl',
  },
  {
    type: 'CV',
    referenceControl: 'cvDocumentRef',
    statusControl: 'cvDocumentStatus',
    fileNameControl: 'cvDocumentFileName',
    fileDataControl: 'cvDocumentFileDataUrl',
  },
  {
    type: 'Diplôme principal',
    referenceControl: 'diplomaDocumentRef',
    statusControl: 'diplomaDocumentStatus',
    fileNameControl: 'diplomaDocumentFileName',
    fileDataControl: 'diplomaDocumentFileDataUrl',
  },
  {
    type: 'Acte/Arrêté de nomination',
    referenceControl: 'appointmentDocumentRef',
    statusControl: 'appointmentDocumentStatus',
    fileNameControl: 'appointmentDocumentFileName',
    fileDataControl: 'appointmentDocumentFileDataUrl',
  },
  {
    type: 'Contrat',
    referenceControl: 'contractDocumentRef',
    statusControl: 'contractDocumentStatus',
    fileNameControl: 'contractDocumentFileName',
    fileDataControl: 'contractDocumentFileDataUrl',
  },
] as const;

@Component({
  selector: 'app-agent-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './agent-create.html',
})
export class AgentCreatePage {
  private fb = inject(FormBuilder);
  private personnelService = inject(PersonnelService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  submitting = false;
  uploadingFiles = 0;
  photoPreview = './assets/images/faces/profile.jpg';
  selectedPhotoFileName = '';

  form = this.fb.group({
    matricule: ['', [Validators.pattern(MATRICULE_PATTERN)]],
    fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    direction: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    unit: ['', [Validators.maxLength(120)]],
    position: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    status: ['Actif', [Validators.required]],
    manager: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    phone: ['', [Validators.pattern(PHONE_PATTERN)]],
    photoUrl: [''],
    identityType: ['CNI'],
    identityNumber: [''],
    birthDate: [''],
    birthPlace: [''],
    nationality: ['Guinéenne'],
    hireDate: [''],
    contractType: ['Fonctionnaire'],
    address: [''],
    emergencyContactName: [''],
    emergencyContactPhone: ['', [Validators.pattern(PHONE_PATTERN)]],
    identityDocumentRef: [''],
    identityDocumentStatus: ['Valide'],
    identityDocumentFileName: [''],
    identityDocumentFileDataUrl: [''],
    cvDocumentRef: [''],
    cvDocumentStatus: ['Valide'],
    cvDocumentFileName: [''],
    cvDocumentFileDataUrl: [''],
    diplomaDocumentRef: [''],
    diplomaDocumentStatus: ['Valide'],
    diplomaDocumentFileName: [''],
    diplomaDocumentFileDataUrl: [''],
    appointmentDocumentRef: [''],
    appointmentDocumentStatus: ['Valide'],
    appointmentDocumentFileName: [''],
    appointmentDocumentFileDataUrl: [''],
    contractDocumentRef: [''],
    contractDocumentStatus: ['Valide'],
    contractDocumentFileName: [''],
    contractDocumentFileDataUrl: [''],
    educations: this.fb.array([this.createEducationGroup()]),
    additionalDocuments: this.fb.array([]),
  });

  get educations(): FormArray {
    return this.form.get('educations') as FormArray;
  }

  get additionalDocuments(): FormArray {
    return this.form.get('additionalDocuments') as FormArray;
  }

  addEducation(): void {
    this.educations.push(this.createEducationGroup());
  }

  removeEducation(index: number): void {
    if (this.educations.length <= 1) {
      return;
    }
    this.educations.removeAt(index);
  }

  addAdditionalDocument(): void {
    this.additionalDocuments.push(this.createAdditionalDocumentGroup());
  }

  removeAdditionalDocument(index: number): void {
    this.additionalDocuments.removeAt(index);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    const mimeType = file.type.toLowerCase();
    if (!mimeType.startsWith('image/')) {
      this.toastr.error('La photo doit être une image (PNG/JPG/WebP)', 'Agent', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      this.toastr.error('La photo dépasse 10 MB', 'Agent', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      this.photoPreview = dataUrl || './assets/images/faces/profile.jpg';
      this.selectedPhotoFileName = file.name;
      this.uploadFile(file, (uploaded) => {
        this.form.patchValue({ photoUrl: uploaded.url });
        this.selectedPhotoFileName = uploaded.fileName || file.name;
      });
    };
    reader.readAsDataURL(file);
  }

  onRequiredDocumentFileSelected(referenceControl: string, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    if (!this.validateDocumentFile(file)) {
      return;
    }

    const fileNameControl = referenceControl.replace('Ref', 'FileName');
    const fileDataControl = referenceControl.replace('Ref', 'FileDataUrl');
    this.uploadFile(file, (uploaded) => {
      this.form.patchValue({
        [fileNameControl]: uploaded.fileName || file.name,
        [fileDataControl]: uploaded.url,
      } as Record<string, string>);
    });
  }

  onAdditionalDocumentFileSelected(index: number, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    if (!this.validateDocumentFile(file)) {
      return;
    }

    const control = this.additionalDocuments.at(index);
    if (!control) {
      return;
    }

    this.uploadFile(file, (uploaded) => {
      control.patchValue({
        fileName: uploaded.fileName || file.name,
        fileDataUrl: uploaded.url,
      });
    });
  }

  fieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['email']) return 'Format email invalide';
    if (control.errors['pattern']) {
      if (fieldName === 'matricule') return 'Format attendu: PRM-0001';
      if (fieldName === 'phone' || fieldName === 'emergencyContactPhone') return 'Telephone invalide';
      return 'Format invalide';
    }
    return 'Valeur invalide';
  }

  saveDraft(): void {
    this.submit(true);
  }

  save(): void {
    this.submit(false);
  }

  private submit(isDraft: boolean): void {
    if (this.uploadingFiles > 0) {
      this.toastr.warning('Veuillez attendre la fin des téléversements en cours', 'Agent', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
      return;
    }

    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const documents = this.buildDocumentsPayload(isDraft);
    const educations = this.buildEducationsPayload();
    const payload: CreateAgentPayload = {
      matricule: this.form.value.matricule?.trim(),
      fullName: this.form.value.fullName?.trim() || '',
      direction: this.form.value.direction?.trim() || '',
      unit: this.form.value.unit?.trim(),
      position: this.form.value.position?.trim() || '',
      status: isDraft ? 'Brouillon' : this.form.value.status?.trim() || 'Actif',
      manager: this.form.value.manager?.trim() || '',
      email: this.form.value.email?.trim(),
      phone: this.form.value.phone?.trim(),
      photoUrl: this.form.value.photoUrl?.trim() || undefined,
      identity: {
        identityType: this.form.value.identityType?.trim() || '',
        identityNumber: this.form.value.identityNumber?.trim() || '',
        birthDate: this.form.value.birthDate || '',
        birthPlace: this.form.value.birthPlace?.trim() || '',
        nationality: this.form.value.nationality?.trim() || '',
      },
      administrative: {
        hireDate: this.form.value.hireDate || '',
        contractType: this.form.value.contractType?.trim() || '',
        address: this.form.value.address?.trim() || '',
        emergencyContactName: this.form.value.emergencyContactName?.trim() || '',
        emergencyContactPhone: this.form.value.emergencyContactPhone?.trim() || '',
      },
      educations,
      documents,
      isDraft,
    };

    if (!isDraft) {
      const finalValidationError = this.validateFinalSubmission(payload);
      if (finalValidationError) {
        this.toastr.error(finalValidationError, 'Agent', {
          timeOut: 3500,
          positionClass: 'toast-top-right',
        });
        return;
      }
    }

    this.submitting = true;
    this.personnelService
      .createAgent(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (created) => {
          this.toastr.success(
            isDraft ? 'Brouillon agent enregistré avec succès' : 'Agent créé avec succès',
            'Agent',
            {
              timeOut: 2400,
              positionClass: 'toast-top-right',
            }
          );
          this.router.navigate(['/personnel/agents', created.id]);
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Agent', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private createEducationGroup() {
    return this.fb.group({
      degree: [''],
      field: [''],
      institution: [''],
      graduationYear: [''],
    });
  }

  private createAdditionalDocumentGroup() {
    return this.fb.group({
      type: [''],
      reference: [''],
      status: ['Valide'],
      fileName: [''],
      fileDataUrl: [''],
    });
  }

  private buildEducationsPayload() {
    return this.educations.controls
      .map((control) => ({
        degree: String(control.value?.degree || '').trim(),
        field: String(control.value?.field || '').trim(),
        institution: String(control.value?.institution || '').trim(),
        graduationYear: String(control.value?.graduationYear || '').trim(),
      }))
      .filter((item) => item.degree || item.field || item.institution || item.graduationYear);
  }

  private buildDocumentsPayload(isDraft: boolean) {
    const formValue = this.form.value as Record<string, unknown>;

    const requiredDocs = REQUIRED_DOCUMENT_DEFINITIONS
      .map((definition) => {
        const reference = String(formValue[definition.referenceControl] || '').trim();
        const status = String(formValue[definition.statusControl] || 'Valide').trim();
        const fileName = String(formValue[definition.fileNameControl] || '').trim();
        const fileDataUrl = String(formValue[definition.fileDataControl] || '').trim();

        if (!reference && !fileDataUrl && isDraft) {
          return null;
        }

        return {
          type: definition.type,
          reference,
          status: status || 'Valide',
          required: true,
          fileName,
          fileDataUrl,
        };
      })
      .filter((item): item is NonNullable<typeof item> => !!item);

    const additional = this.additionalDocuments.controls
      .map((control) => ({
        type: String(control.value?.type || '').trim(),
        reference: String(control.value?.reference || '').trim(),
        status: String(control.value?.status || 'Valide').trim() || 'Valide',
        required: false,
        fileName: String(control.value?.fileName || '').trim(),
        fileDataUrl: String(control.value?.fileDataUrl || '').trim(),
      }))
      .filter((item) => item.type && item.reference && item.fileDataUrl);

    return [...requiredDocs, ...additional];
  }

  private validateFinalSubmission(payload: CreateAgentPayload): string | null {
    if (!payload.photoUrl || !payload.photoUrl.trim()) {
      return "La photo d'identité est obligatoire pour la création finale";
    }

    const missingRequiredDocuments = REQUIRED_DOCUMENT_DEFINITIONS.filter((definition) => {
      const formValue = this.form.value as Record<string, unknown>;
      const reference = String(formValue[definition.referenceControl] || '').trim();
      const fileDataUrl = String(formValue[definition.fileDataControl] || '').trim();
      return !reference || !fileDataUrl;
    });

    if (missingRequiredDocuments.length > 0) {
      return `Pièces obligatoires manquantes: ${missingRequiredDocuments.map((item) => item.type).join(', ')}`;
    }

    if (!payload.identity?.identityNumber?.trim()) {
      return "Le numéro de pièce d'identité est obligatoire";
    }

    if ((payload.educations || []).length === 0) {
      return 'Au moins un diplôme doit être renseigné';
    }

    return null;
  }

  private uploadFile(
    file: File,
    onSuccess: (uploaded: { url: string; fileName: string }) => void
  ): void {
    this.uploadingFiles += 1;
    this.personnelService
      .uploadAgentFile(file)
      .pipe(finalize(() => (this.uploadingFiles = Math.max(0, this.uploadingFiles - 1))))
      .subscribe({
        next: (uploaded) => {
          onSuccess({
            url: uploaded.url,
            fileName: uploaded.fileName || file.name,
          });
          this.toastr.success(`Fichier téléversé: ${uploaded.fileName || file.name}`, 'Agent', {
            timeOut: 1800,
            positionClass: 'toast-top-right',
          });
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Agent', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private validateDocumentFile(file: File): boolean {
    const mimeType = (file.type || '').toLowerCase();
    const lowerFileName = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_DOCUMENT_EXTENSIONS.some((extension) => lowerFileName.endsWith(extension));
    const isAllowedMimeType = mimeType ? ALLOWED_DOCUMENT_MIME_TYPES.has(mimeType) : hasAllowedExtension;

    if (!isAllowedMimeType || !hasAllowedExtension) {
      this.toastr.error('Document invalide: formats autorisés PDF/JPG/PNG/WebP', 'Agent', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return false;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      this.toastr.error('Le document dépasse 10 MB', 'Agent', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return false;
    }

    return true;
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

    return "Opération impossible pour le moment";
  }
}
