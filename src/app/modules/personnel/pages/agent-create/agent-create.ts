import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CreateAgentPayload, PersonnelService } from '../../personnel.service';

@Component({
  selector: 'app-agent-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './agent-create.html',
})
export class AgentCreatePage {
  private fb = inject(FormBuilder);
  private personnelService = inject(PersonnelService);
  private router = inject(Router);

  submitting = false;

  form = this.fb.group({
    matricule: [''],
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    direction: ['', [Validators.required]],
    unit: [''],
    position: ['', [Validators.required]],
    status: ['Actif', [Validators.required]],
    manager: ['', [Validators.required]],
    email: ['', [Validators.email]],
    phone: [''],
  });

  save(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateAgentPayload = {
      matricule: this.form.value.matricule?.trim(),
      fullName: this.form.value.fullName?.trim() || '',
      direction: this.form.value.direction?.trim() || '',
      unit: this.form.value.unit?.trim(),
      position: this.form.value.position?.trim() || '',
      status: this.form.value.status?.trim() || 'Actif',
      manager: this.form.value.manager?.trim() || '',
      email: this.form.value.email?.trim(),
      phone: this.form.value.phone?.trim(),
    };

    this.submitting = true;
    this.personnelService
      .createAgent(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe((created) => {
        this.router.navigate(['/personnel/agents', created.id]);
      });
  }
}
