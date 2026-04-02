import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@Component({
    selector: 'app-search',
    imports: [ RouterModule, FormsModule, ReactiveFormsModule],
    templateUrl: './search.html',
    styleUrl: './search.scss'
})
export class Search {
  tabs = ['All', 'Images', 'Books', 'News', 'Videos'];
  selectedTab = 'All';

  selectTab(tab: string) {
    this.selectedTab = tab;
  }
}


