import { AppStateService } from './../../../../shared/services/app-state.service';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-error-404',
  imports: [RouterModule],
  templateUrl: './error-404.html',
  styleUrl: './error-404.scss'
})
export class Error404 {
  private appStateService = inject(AppStateService);

  constructor() {
    document.body.classList.add('error-page1', 'bg-primary');
    document.querySelector('html')?.removeAttribute('data-width');

  }

  ngOnDestroy(): void {
    document.body.classList.remove('error-page1', 'bg-primary');
    this.appStateService.updateState()
  }


}


