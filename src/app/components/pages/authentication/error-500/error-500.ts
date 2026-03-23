import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppStateService } from '../../../../shared/services/app-state.service';

@Component({
  selector: 'app-error-500',
  imports: [RouterModule],
  templateUrl: './error-500.html',
  styleUrl: './error-500.scss'
})
export class Error500 {
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


