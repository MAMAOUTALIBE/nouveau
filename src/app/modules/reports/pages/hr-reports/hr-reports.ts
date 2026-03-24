import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import { HrReportSnapshot, HrReportsService } from '../../hr-reports.service';

@Component({
  selector: 'app-hr-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hr-reports.html',
})
export class HrReportsPage implements OnInit {
  private reportsService = inject(HrReportsService);
  private toastr = inject(ToastrService);

  isLoading = false;
  snapshot: HrReportSnapshot | null = null;
  selectedPeriodDays = 90;
  selectedDirection = 'all';

  periodOptions = [
    { value: 30, label: '30 jours' },
    { value: 90, label: '90 jours' },
    { value: 180, label: '180 jours' },
    { value: 365, label: '12 mois' },
  ];

  directionOptions = [{ value: 'all', label: 'Toutes les directions' }];

  quickExports = [
    { id: 'direction', name: 'Effectifs par direction', format: 'CSV' },
    { id: 'leave_type', name: 'Absences par type', format: 'CSV' },
    { id: 'workflow_status', name: 'Workflows par statut', format: 'CSV' },
  ];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.isLoading = true;
    this.reportsService
      .buildSnapshot({
        periodDays: this.selectedPeriodDays,
        direction: this.selectedDirection === 'all' ? undefined : this.selectedDirection,
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (snapshot) => {
          this.snapshot = snapshot;
          this.refreshDirectionOptions(snapshot);
        },
        error: () => {
          this.toastr.error('Impossible de charger les rapports RH', 'Rapports', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  exportExcel(): void {
    if (!this.snapshot) {
      return;
    }

    downloadCsv({
      filename: `rapport-rh-${this.exportDateSuffix()}.csv`,
      delimiter: ';',
      headers: ['Section', 'Champ', 'Valeur'],
      rows: this.buildWorkbookRows(this.snapshot),
    });
  }

  exportPdf(): void {
    if (!this.snapshot) {
      return;
    }

    const popup = window.open('', '_blank', 'noopener,noreferrer,width=960,height=740');
    if (!popup) {
      this.toastr.warning("Autorise la fenetre popup pour l'export PDF", 'Rapports', {
        timeOut: 2600,
        positionClass: 'toast-top-right',
      });
      return;
    }

    popup.document.write(this.buildPrintableHtml(this.snapshot));
    popup.document.close();
    popup.focus();
    popup.print();
  }

  exportQuick(sectionId: string): void {
    if (!this.snapshot) {
      return;
    }

    switch (sectionId) {
      case 'direction':
        this.exportDistribution(
          `effectifs-direction-${this.exportDateSuffix()}.csv`,
          this.snapshot.directionDistribution
        );
        return;
      case 'leave_type':
        this.exportDistribution(
          `absences-type-${this.exportDateSuffix()}.csv`,
          this.snapshot.leaveByType
        );
        return;
      case 'workflow_status':
        this.exportDistribution(
          `workflows-statut-${this.exportDateSuffix()}.csv`,
          this.snapshot.workflowByStatus
        );
        return;
      default:
        return;
    }
  }

  asNumber(value: number | string): number {
    return Number(value) || 0;
  }

  private refreshDirectionOptions(snapshot: HrReportSnapshot): void {
    const uniqueDirections = Array.from(
      new Set(snapshot.records.agents.map((agent) => agent.direction.trim()).filter((value) => value.length))
    ).sort((left, right) => left.localeCompare(right));

    this.directionOptions = [
      { value: 'all', label: 'Toutes les directions' },
      ...uniqueDirections.map((direction) => ({
        value: direction,
        label: direction,
      })),
    ];

    if (!this.directionOptions.find((option) => option.value === this.selectedDirection)) {
      this.selectedDirection = 'all';
    }
  }

  private exportDistribution(
    filename: string,
    data: Array<{ label: string; value: number; sharePercent: number }>
  ): void {
    downloadCsv({
      filename,
      delimiter: ';',
      headers: ['Libelle', 'Valeur', 'Part (%)'],
      rows: data.map((entry) => [entry.label, entry.value, entry.sharePercent]),
    });
  }

  private buildWorkbookRows(snapshot: HrReportSnapshot): Array<Array<string | number>> {
    const rows: Array<Array<string | number>> = [];

    snapshot.kpis.forEach((kpi) => {
      rows.push(['KPI', kpi.label, `${kpi.value}${kpi.unit || ''}`]);
    });

    rows.push(['', '', '']);
    snapshot.directionDistribution.forEach((item) => {
      rows.push(['Effectifs par direction', item.label, item.value]);
    });

    rows.push(['', '', '']);
    snapshot.leaveByType.forEach((item) => {
      rows.push(['Absences par type', item.label, item.value]);
    });

    rows.push(['', '', '']);
    snapshot.workflowByStatus.forEach((item) => {
      rows.push(['Workflows par statut', item.label, item.value]);
    });

    rows.push(['', '', '']);
    snapshot.riskItems.forEach((item) => {
      rows.push(['Risques workflow', item.instanceId, item.score]);
    });

    return rows;
  }

  private buildPrintableHtml(snapshot: HrReportSnapshot): string {
    const generatedAt = new Date(snapshot.generatedAt).toLocaleString('fr-FR');
    const kpiRows = snapshot.kpis
      .map(
        (kpi) =>
          `<tr><td>${this.escapeHtml(kpi.label)}</td><td style="text-align:right">${this.escapeHtml(
            `${kpi.value}${kpi.unit || ''}`
          )}</td></tr>`
      )
      .join('');

    const directionRows = snapshot.directionDistribution
      .map(
        (item) =>
          `<tr><td>${this.escapeHtml(item.label)}</td><td style="text-align:right">${item.value}</td><td style="text-align:right">${item.sharePercent}%</td></tr>`
      )
      .join('');

    const riskRows = snapshot.riskItems
      .map(
        (item) =>
          `<tr><td>${this.escapeHtml(item.instanceId)}</td><td>${this.escapeHtml(item.definition)}</td><td>${this.escapeHtml(
            item.status
          )}</td><td>${this.escapeHtml(item.slaState)}</td><td style="text-align:right">${item.score}</td></tr>`
      )
      .join('');

    return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Rapport RH</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
    h1 { margin: 0 0 8px; font-size: 22px; }
    .meta { margin: 0 0 20px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin: 0 0 20px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; }
    th { background: #f3f4f6; text-align: left; }
  </style>
</head>
<body>
  <h1>Rapport RH - Synthese</h1>
  <p class="meta">Genere le ${this.escapeHtml(generatedAt)} | Periode: ${snapshot.filters.periodDays} jours</p>
  <h2>KPI</h2>
  <table><tbody>${kpiRows}</tbody></table>
  <h2>Effectifs par direction</h2>
  <table>
    <thead><tr><th>Direction</th><th>Effectif</th><th>Part</th></tr></thead>
    <tbody>${directionRows}</tbody>
  </table>
  <h2>Top risques workflow</h2>
  <table>
    <thead><tr><th>ID</th><th>Workflow</th><th>Statut</th><th>SLA</th><th>Score</th></tr></thead>
    <tbody>${riskRows}</tbody>
  </table>
</body>
</html>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private exportDateSuffix(): string {
    return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  }
}
