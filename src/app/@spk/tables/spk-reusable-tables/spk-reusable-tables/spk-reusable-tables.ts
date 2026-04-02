import { CommonModule } from '@angular/common';
import { Component, ContentChild, ElementRef, EventEmitter, input, Input, output, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'spk-reusable-tables',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './spk-reusable-tables.html',
  styleUrl: './spk-reusable-tables.scss'
})
export class SpkReusableTables {
  columns = input<any[]>([]);
  tableClass = input<string>('');
  tableHead = input<string>('');
  trHeadClass = input<string>('');
  tableFooter = input<string>('');
  tableBody = input<string>('');
  trClass = input<string>('');
  checkboxClass = input<string>('');
  checkboxinputClass = input<string>('');
  tableFoot = input<string>('');
  tableHeadColumn = input<string>('');
  captionbeforehead = input<boolean>(false);
  captiontitle = input<string>('');
  data = input<any[]>([]);
  title = input<any[]>([]);
  footerData = input<any[]>([]);
  showFooter = input<boolean>(false);
  showCheckbox = input<boolean>(false);
  rows = input<{ checked: boolean;[key: string]: any }[]>([]);
  @ContentChild('footer', { static: false }) footerContent!: ElementRef;
  allTasksChecked!: boolean;
  tableData: any;
  toggleSelectAll = output<boolean>();
  openDetails = output<any>();

  onToggleSelectAll(event: any) {
    this.toggleSelectAll.emit(event.target.checked);
  }
  toggleRowChecked(row: any) {
    row.checked = !row.checked;
    this.allTasksChecked = this.data().every(row => row.checked);
  }

  updateSelectAllCheckbox(): void {
    this.allTasksChecked = this.data().every(row => row.checked);
  }
}
