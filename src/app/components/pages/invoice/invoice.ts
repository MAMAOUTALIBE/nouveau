import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SpkReusableTables } from "../../../@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables";
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-invoice',
  imports: [CurrencyPipe, RouterModule, SpkReusableTables],
  templateUrl: './invoice.html',
  styleUrl: './invoice.scss'
})
export class Invoice {
  invoiceData = {
    columns: [{ header: 'Product', tableHeadColumn: 'wd-20p' },
    { header: 'Description', tableHeadColumn: 'wd-40p' },
    { header: 'Quantity', tableHeadColumn: 'text-center' },
    { header: 'Unit', tableHeadColumn: 'text-end' },
    { header: 'Amount', tableHeadColumn: 'text-end' }],
    rows: [
      {
        product: 'Logo Creation',
        description: 'Logo and business cards design',
        quantity: 2,
        unitPrice: 60.00,
        amount: 120.00
      },
      {
        product: 'Online Store Design & Development',
        description: 'Design/Development for all popular modern browsers',
        quantity: 3,
        unitPrice: 80.00,
        amount: 240.00
      },
      {
        product: 'App Design',
        description: 'Promotional mobile application',
        quantity: 1,
        unitPrice: 40.00,
        amount: 40.00
      }
    ]
  }
}


