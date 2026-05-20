import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import {
  ModernizationCapabilityStatus,
  ModernizationModule,
  ModernizationRoadmapItem,
  ModernizationService,
  ModernizationSignal,
  ModernizationSummary,
  ModernizationTone,
} from '../../modernization.service';

@Component({
  selector: 'app-modernization-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './modernization-dashboard.html',
})
export class ModernizationDashboardPage implements OnInit {
  private readonly modernizationService = inject(ModernizationService);

  isLoading = false;
  summary: ModernizationSummary | null = null;
  generatedAtLabel = '';

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.isLoading = true;
    this.modernizationService
      .getSummary()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((summary) => {
        this.summary = summary;
        this.generatedAtLabel = this.formatDateTime(summary.generatedAt);
      });
  }

  trackModule(_: number, item: ModernizationModule): string {
    return item.code;
  }

  trackSignal(_: number, item: ModernizationSignal): string {
    return `${item.module}-${item.title}`;
  }

  trackRoadmap(_: number, item: ModernizationRoadmapItem): string {
    return `${item.owner}-${item.label}`;
  }

  statusBadgeClass(status: ModernizationCapabilityStatus): string {
    switch (status) {
      case 'Operationnel':
        return 'bg-success-transparent text-success';
      case 'En cours':
        return 'bg-primary-transparent text-primary';
      case 'A parametrer':
        return 'bg-warning-transparent text-warning';
      case 'Surveillance':
        return 'bg-info-transparent text-info';
      default:
        return 'bg-light text-dark';
    }
  }

  toneClass(tone: ModernizationTone): string {
    switch (tone) {
      case 'success':
        return 'bg-success-transparent text-success';
      case 'warning':
        return 'bg-warning-transparent text-warning';
      case 'danger':
        return 'bg-danger-transparent text-danger';
      case 'info':
        return 'bg-info-transparent text-info';
      case 'secondary':
        return 'bg-secondary-transparent text-secondary';
      default:
        return 'bg-primary-transparent text-primary';
    }
  }

  progressClass(value: number): string {
    if (value >= 80) return 'bg-success';
    if (value >= 55) return 'bg-primary';
    if (value >= 35) return 'bg-warning';
    return 'bg-danger';
  }

  severityClass(severity: ModernizationSignal['severity']): string {
    switch (severity) {
      case 'Critique':
        return 'bg-danger';
      case 'Eleve':
        return 'bg-danger-transparent text-danger';
      case 'Modere':
        return 'bg-warning-transparent text-warning';
      default:
        return 'bg-success-transparent text-success';
    }
  }

  private formatDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }
}
