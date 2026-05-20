import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  CreatePerfResultPayload,
  PerfResult,
  PerformanceService
} from '../../performance.service';

@Component({
  selector: 'app-perf-results',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './perf-results.html',
})
export class PerfResultsPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private performanceService = inject(PerformanceService);
  private toastr = inject(ToastrService);

  items: PerfResult[] = [];
  showCreateForm = false;
  submitting = false;
  successionPlans: Array<{ agent: string; direction: string; readiness: string; targetRole: string; score: number }> = [];
  sentimentSignals: Array<{ agent: string; signal: string; severity: 'Alerte' | 'Critique' }> = [];
  mobilityRecommendations: Array<{ agent: string; recommendation: string; score: number }> = [];
  skillsMatrix: Array<{ direction: string; averageScore: number; population: number; level: string }> = [];

  gridConfig = {
    columns: ['Agent', 'Direction', 'Auto-éval', 'Manager', 'Score final', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    agent: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    direction: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    selfScore: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    managerScore: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    finalScore: [''],
    status: ['En revue', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadResults();
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

  saveResult(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const selfScore = Number(this.form.value.selfScore ?? 0);
    const managerScore = Number(this.form.value.managerScore ?? 0);
    const finalScoreRaw = String(this.form.value.finalScore || '').trim();
    const finalScore = finalScoreRaw.length ? Number(finalScoreRaw) : Math.round((selfScore + managerScore) / 2);

    if (!Number.isFinite(finalScore) || finalScore < 0 || finalScore > 100) {
      this.toastr.error('Score final invalide (0 a 100)', 'Evaluation', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreatePerfResultPayload = {
      agent: this.form.value.agent?.trim() || '',
      direction: this.form.value.direction?.trim() || '',
      selfScore,
      managerScore,
      finalScore,
      status: this.form.value.status?.trim() || 'En revue',
    };

    this.submitting = true;
    this.performanceService
      .createResult(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Resultat evaluation enregistre avec succes', 'Evaluation', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadResults();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Evaluation', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadResults(): void {
    this.performanceService.getResults().subscribe({
      next: (items) => {
        this.items = items;
        this.recomputePerformanceInsights(items);
        this.gridConfig = {
          ...this.gridConfig,
          data: items.map((r) => [
            r.agent,
            r.direction,
            r.selfScore,
            r.managerScore,
            r.finalScore,
            r.status,
          ]),
        };
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.items = [];
        this.successionPlans = [];
        this.sentimentSignals = [];
        this.mobilityRecommendations = [];
        this.skillsMatrix = [];
        this.gridConfig = { ...this.gridConfig, data: [] };
        this.toastr.error(this.resolveError(error), 'Evaluation', {
          timeOut: 3500,
          positionClass: 'toast-top-right',
        });
        this.cdr.detectChanges();
      },
    });
  }

  private resetForm(): void {
    this.form.reset({
      agent: '',
      direction: '',
      selfScore: 0,
      managerScore: 0,
      finalScore: '',
      status: 'En revue',
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

  private recomputePerformanceInsights(items: PerfResult[]): void {
    this.successionPlans = items
      .filter((item) => item.finalScore >= 80)
      .sort((left, right) => right.finalScore - left.finalScore)
      .slice(0, 6)
      .map((item) => ({
        agent: item.agent,
        direction: item.direction,
        readiness: item.finalScore >= 90 ? 'Pret maintenant' : 'Pret sous 12 mois',
        targetRole: `Responsable ${item.direction}`,
        score: item.finalScore,
      }));

    this.sentimentSignals = items
      .map((item) => {
        const gap = item.managerScore - item.selfScore;
        if (gap <= -20) {
          return {
            agent: item.agent,
            signal: 'Auto-evaluation nettement superieure a la note manager',
            severity: 'Alerte' as const,
          };
        }
        if (gap >= 25) {
          return {
            agent: item.agent,
            signal: 'Note manager tres superieure a l auto-evaluation',
            severity: 'Alerte' as const,
          };
        }
        if (item.finalScore < 45) {
          return {
            agent: item.agent,
            signal: 'Score final faible: accompagnement prioritaire',
            severity: 'Critique' as const,
          };
        }
        return null;
      })
      .filter((item): item is { agent: string; signal: string; severity: 'Alerte' | 'Critique' } => !!item)
      .slice(0, 8);

    this.mobilityRecommendations = items
      .filter((item) => item.finalScore >= 70)
      .sort((left, right) => right.finalScore - left.finalScore)
      .slice(0, 6)
      .map((item) => ({
        agent: item.agent,
        score: item.finalScore,
        recommendation:
          item.finalScore >= 85
            ? `Mobilite interne vers un role de coordination ${item.direction}`
            : `Plan de developpement cible pour consolider ${item.direction}`,
      }));

    const byDirection = new Map<string, { total: number; count: number }>();
    items.forEach((item) => {
      const current = byDirection.get(item.direction) || { total: 0, count: 0 };
      current.total += item.finalScore;
      current.count += 1;
      byDirection.set(item.direction, current);
    });
    this.skillsMatrix = Array.from(byDirection.entries())
      .map(([direction, bucket]) => {
        const averageScore = bucket.count > 0 ? Math.round((bucket.total / bucket.count) * 10) / 10 : 0;
        return {
          direction,
          averageScore,
          population: bucket.count,
          level: averageScore >= 80 ? 'Expertise forte' : averageScore >= 60 ? 'Socle stable' : 'Renforcement requis',
        };
      })
      .sort((left, right) => right.averageScore - left.averageScore);
  }
}
