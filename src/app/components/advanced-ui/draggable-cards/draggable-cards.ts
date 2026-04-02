import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { SortablejsModule } from '@maksim_m/ngx-sortablejs';

@Component({
    selector: 'app-draggable-cards',
    imports: [ RouterModule, SortablejsModule, NgbCollapseModule],
    templateUrl: './draggable-cards.html',
    styleUrl: './draggable-cards.scss'
})
export class DraggableCards {
  isCardVisible = true;

  toggleCard() {
    this.isCardVisible = !this.isCardVisible;
  }

  isCollapsed = false;
  isCollapsed1 = false;

  closeResult: string | undefined;

  ngOnInit(): void {}
  fullScreenToggle() {
    document
      .querySelector('.fullscreentoggle')
      ?.classList.toggle('card-fullscreen');
  }

    // Define sortable options
    normalOptions = {
      animation: 150,
      group: 'shared',
      // Add other options here as needed
    };
    // Handle sort end event
    onSortEnd(event: any) { }
    normalList1:any
    normalList2:any
}


