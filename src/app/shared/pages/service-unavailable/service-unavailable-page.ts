import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom, timeout } from 'rxjs';
import { readLastHealthyRoute } from '../../../core/recovery/route-recovery';

@Component({
  selector: 'app-service-unavailable-page',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf],
  templateUrl: './service-unavailable-page.html',
  styleUrl: './service-unavailable-page.scss',
})
export class ServiceUnavailablePage implements OnInit, OnDestroy {
  protected readonly attemptHistory: AttemptEntry[] = [];
  private readonly autoRetryIntervalMs = 10_000;
  private readonly maxAttemptHistory = 5;
  private autoRetryTimer: ReturnType<typeof setInterval> | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private nextAutoRetryAtMs: number | null = null;
  private readonly route = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);
  private readonly rawHttp = new HttpClient(inject(HttpBackend));

  protected isRetrying = false;
  protected autoRetryEnabled = true;
  protected autoRetryCountdownSeconds = 10;
  protected statusMessage = '';
  protected lastAttemptAtLabel = 'Aucune tentative';
  protected readonly returnUrl = this.resolveReturnUrl(
    this.route.snapshot.queryParamMap.get('returnUrl')
  );

  ngOnInit(): void {
    this.startAutoRetry();
  }

  ngOnDestroy(): void {
    this.stopAutoRetry();
  }

  toggleAutoRetry(): void {
    this.autoRetryEnabled = !this.autoRetryEnabled;
    if (this.autoRetryEnabled) {
      this.statusMessage = 'Auto-retry active (toutes les 10 secondes).';
      this.startAutoRetry();
      return;
    }

    this.statusMessage = 'Auto-retry desactive.';
    this.stopAutoRetry();
  }

  async retryNow(options: { source?: 'manual' | 'auto' } = {}): Promise<void> {
    if (this.isRetrying) {
      return;
    }

    if (options.source === 'manual' && this.autoRetryEnabled) {
      this.resetAutoRetryWindow();
    }

    this.isRetrying = true;
    this.statusMessage = '';
    this.lastAttemptAtLabel = this.formatAttemptTime(new Date());

    const reachable = await this.isBackendReachable();
    if (!reachable) {
      this.statusMessage = `Derniere tentative ${this.lastAttemptAtLabel}: service toujours indisponible.`;
      this.recordAttempt({
        atLabel: this.lastAttemptAtLabel,
        source: options.source === 'auto' ? 'AUTO' : 'MANUEL',
        result: 'ECHEC',
        details: 'Service indisponible',
      });
      if (options.source !== 'auto') {
        this.toastr.warning('Le service est toujours indisponible. Reessayez dans quelques instants.', 'Primature RH', {
          timeOut: 3000,
          positionClass: 'toast-top-right',
        });
      }
      this.isRetrying = false;
      return;
    }

    if (options.source !== 'auto') {
      this.toastr.success('Service retabli. Relance en cours.', 'Primature RH', {
        timeOut: 2500,
        positionClass: 'toast-top-right',
      });
    }
    this.recordAttempt({
      atLabel: this.lastAttemptAtLabel,
      source: options.source === 'auto' ? 'AUTO' : 'MANUEL',
      result: 'SUCCES',
      details: 'Service retabli',
    });
    this.statusMessage = `Service retabli a ${this.lastAttemptAtLabel}. Reprise en cours...`;
    const recoveryTarget = this.appendRecoveryFlag(this.returnUrl);
    window.location.assign(recoveryTarget);
  }

  private async isBackendReachable(): Promise<boolean> {
    const healthOk = await this.probeHealthEndpoint();
    if (healthOk) {
      return true;
    }
    return this.probeApiEndpoint();
  }

  private async probeHealthEndpoint(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.rawHttp.get('/health').pipe(timeout({ each: 4000 }))
      );
      return true;
    } catch {
      return false;
    }
  }

  private async probeApiEndpoint(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.rawHttp.get('/api/v1/dashboard/summary').pipe(timeout({ each: 5000 }))
      );
      return true;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        return error.status === 401 || error.status === 403;
      }
      return false;
    }
  }

  private resolveReturnUrl(rawValue: string | null): string {
    const raw = String(rawValue || '').trim();
    if (raw.startsWith('/') && !raw.startsWith('/service-indisponible')) {
      return raw;
    }

    const lastHealthy = readLastHealthyRoute();
    if (lastHealthy) {
      return lastHealthy;
    }

    return '/dashboard';
  }

  private appendRecoveryFlag(target: string): string {
    const separator = target.includes('?') ? '&' : '?';
    return `${target}${separator}recoveryTs=${Date.now()}`;
  }

  private startAutoRetry(): void {
    if (!this.autoRetryEnabled) {
      return;
    }

    this.stopAutoRetry();
    this.resetAutoRetryWindow();
    this.countdownTimer = setInterval(() => {
      this.autoRetryCountdownSeconds = this.computeAutoRetryCountdownSeconds();
    }, 1000);
    this.autoRetryTimer = setInterval(() => {
      void this.retryNow({ source: 'auto' }).finally(() => {
        if (this.autoRetryEnabled) {
          this.resetAutoRetryWindow();
        }
      });
    }, this.autoRetryIntervalMs);
  }

  private stopAutoRetry(): void {
    if (this.autoRetryTimer) {
      clearInterval(this.autoRetryTimer);
      this.autoRetryTimer = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.nextAutoRetryAtMs = null;
    this.autoRetryCountdownSeconds = 0;
  }

  private formatAttemptTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  private recordAttempt(entry: Omit<AttemptEntry, 'id'>): void {
    const nextEntry: AttemptEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...entry,
    };
    this.attemptHistory.unshift(nextEntry);
    if (this.attemptHistory.length > this.maxAttemptHistory) {
      this.attemptHistory.splice(this.maxAttemptHistory);
    }
  }

  private resetAutoRetryWindow(): void {
    this.nextAutoRetryAtMs = Date.now() + this.autoRetryIntervalMs;
    this.autoRetryCountdownSeconds = this.computeAutoRetryCountdownSeconds();
  }

  private computeAutoRetryCountdownSeconds(): number {
    if (!this.nextAutoRetryAtMs) {
      return 0;
    }

    const remainingMs = this.nextAutoRetryAtMs - Date.now();
    if (remainingMs <= 0) {
      return 0;
    }

    return Math.ceil(remainingMs / 1000);
  }
}

interface AttemptEntry {
  id: string;
  atLabel: string;
  source: 'AUTO' | 'MANUEL';
  result: 'SUCCES' | 'ECHEC';
  details: string;
}
