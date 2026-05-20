import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import { AdminService, AuditLogItem } from '../../admin.service';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './admin-audit.html',
})
export class AdminAuditPage implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  gridConfig = {
    columns: ['Date', 'Utilisateur', 'Action', 'Cible'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    user: [''],
    action: [''],
    dateFrom: [''],
    dateTo: [''],
    page: [1],
    limit: [20],
  });

  auditItems: AuditLogItem[] = [];
  total = 0;

  ngOnInit(): void {
    this.loadAudit();
  }

  loadAudit(): void {
    const user = this.form.value.user?.trim();
    const action = this.form.value.action?.trim();
    const dateFrom = this.form.value.dateFrom || undefined;
    const dateTo = this.form.value.dateTo || undefined;
    const page = Number(this.form.value.page) || 1;
    const limit = Number(this.form.value.limit) || 20;

    this.adminService.getAudit({ user, action, page, limit, dateFrom, dateTo }).subscribe((items) => {
      this.auditItems = items;
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((a) => [a.date, a.user, a.action, a.target]),
      };
    });
  }

  nextPage(): void {
    const page = (Number(this.form.value.page) || 1) + 1;
    this.form.patchValue({ page });
    this.loadAudit();
  }

  prevPage(): void {
    const page = Math.max((Number(this.form.value.page) || 1) - 1, 1);
    this.form.patchValue({ page });
    this.loadAudit();
  }

  exportCsv(): void {
    downloadCsv({
      filename: 'audit.csv',
      delimiter: ';',
      headers: ['date', 'user', 'action', 'target'],
      rows: this.auditItems.map((item) => [
        item.date,
        item.user,
        item.action,
        item.target,
      ]),
    });
  }
}
