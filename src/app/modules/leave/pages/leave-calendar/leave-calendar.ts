import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { CreateLeaveEventPayload, LeaveEvent, LeaveService } from '../../leave.service';

@Component({
  selector: 'app-leave-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, ReactiveFormsModule],
  templateUrl: './leave-calendar.html',
})
export class LeaveCalendarPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private leaveService = inject(LeaveService);
  private toastr = inject(ToastrService);

  events: LeaveEvent[] = [];
  showCreateForm = false;
  submitting = false;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,dayGridDay',
    },
    height: 'auto',
    navLinks: true,
    dayMaxEvents: true,
    events: [],
  };

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(140)]],
    start: ['', [Validators.required]],
    end: [''],
    className: ['bg-primary-transparent', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadEvents();
  }

  fieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caracteres`;
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

  saveEvent(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const start = this.form.value.start || '';
    const end = this.form.value.end || '';
    if (end) {
      const startTimestamp = Date.parse(start);
      const endTimestamp = Date.parse(end);
      if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp) || endTimestamp < startTimestamp) {
        this.toastr.error('La date de fin doit etre superieure ou egale a la date de debut', 'Absences', {
          timeOut: 3500,
          positionClass: 'toast-top-right',
        });
        return;
      }
    }

    const payload: CreateLeaveEventPayload = {
      title: this.form.value.title?.trim() || '',
      start,
      end: end || undefined,
      className: this.form.value.className || 'bg-primary-transparent',
    };

    this.submitting = true;
    this.leaveService
      .createEvent(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Evenement absence planifie avec succes', 'Absences', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadEvents();
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

  private loadEvents(): void {
    this.leaveService.getEvents().subscribe({
      next: (items) => {
        this.events = items;
        this.calendarOptions = {
          ...this.calendarOptions,
          events: items,
        };
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.events = [];
        this.calendarOptions = {
          ...this.calendarOptions,
          events: [],
        };
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
      title: '',
      start: '',
      end: '',
      className: 'bg-primary-transparent',
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
