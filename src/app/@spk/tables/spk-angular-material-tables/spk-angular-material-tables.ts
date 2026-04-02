import { Component, effect, input, signal, ViewChild } from '@angular/core';
import { MaterialModuleModule } from './material-module.module';
import { CommonModule } from '@angular/common';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';

interface TableData {
  [key: string]: string | number | boolean | null | undefined;
}

@Component({
  selector: 'spk-angular-material-tables',
  standalone: true,
  imports: [MaterialModuleModule, CommonModule],
  templateUrl: './spk-angular-material-tables.html',
  styleUrl: './spk-angular-material-tables.scss'
})
export class SpkAngularMaterialTables {
  // Inputs
  dataSource = input<TableData[]>([]);
  displayedColumns = input<string[]>([]);
  showFilter = input<boolean>(false);
  showPaginator = input<boolean>(false);
  showAddButton = input<boolean>(false);
  showDeleteButton = input<boolean>(false);
  tableClass = input<string>();
  divClass = input<string>();
  id = input<string>();
  // Signals
  DatatableSource = signal(new MatTableDataSource<TableData>([]));
  filterValue = signal('');
  dataToDisplay = signal<TableData[]>([]);

  // ViewChild references
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<TableData>;

  constructor() {
    // Effect to update MatTableDataSource when dataToDisplay or filterValue changes
    effect(() => {
      const filteredData = this.dataToDisplay();
      const source = this.DatatableSource();

      source.data = filteredData;

      source.filterPredicate = (data: any, filter: string) => {
        const dataStr = `${data.firstName} ${data.lastName} ${data.position} ${data.startDate} ${data.salary} ${data.email}`.toLowerCase();
        return dataStr.includes(filter);
      };

      source.filter = this.filterValue().trim().toLowerCase();

      if (this.paginator) source.paginator = this.paginator;
      if (this.sort) source.sort = this.sort;

      this.DatatableSource.set(source);
    });

    // Initialize dataToDisplay from input
    effect(() => {
      this.dataToDisplay.set([...this.dataSource()]);
    });
  }

  ngAfterViewInit() {
    const source = this.DatatableSource();
    if (this.paginator) source.paginator = this.paginator;
    if (this.sort) source.sort = this.sort;
    this.DatatableSource.set(source);
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.filterValue.set(value);
    const source = this.DatatableSource();
    source.filter = value;
    this.DatatableSource.set(source);
  }

  addData() {
    const sourceData = this.dataSource();
    if (sourceData.length === 0) return;

    const randomElementIndex = Math.floor(Math.random() * sourceData.length);
    const newRow = { ...sourceData[randomElementIndex] };
    const currentData = [...this.dataToDisplay()];

    const insertIndex = this.paginator ? this.paginator.pageIndex * this.paginator.pageSize : currentData.length;
    currentData.splice(insertIndex, 0, newRow);

    this.dataToDisplay.set(currentData);

    const source = this.DatatableSource();
    source.data = currentData;

    if (this.paginator) {
      source.paginator = this.paginator;
      this.paginator._changePageSize(this.paginator.pageSize);
    }

    if (this.sort) source.sort = this.sort;
    this.DatatableSource.set(source);
    if (this.table) this.table.renderRows();
  }

  removeData() {
    const currentData = [...this.dataToDisplay()];
    if (currentData.length === 0) return;

    const removeIndex = this.paginator ? this.paginator.pageIndex * this.paginator.pageSize : currentData.length - 1;
    currentData.splice(removeIndex, 1);

    this.dataToDisplay.set(currentData);

    const source = this.DatatableSource();
    source.data = currentData;

    if (this.paginator) {
      source.paginator = this.paginator;
      this.paginator._changePageSize(this.paginator.pageSize);
    }

    if (this.sort) source.sort = this.sort;
    this.DatatableSource.set(source);
    if (this.table) this.table.renderRows();
  }

}
