import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppStateService } from '../../../../shared/services/app-state.service';

@Component({
  selector: 'app-error-501',
  imports: [RouterModule],
  templateUrl: './error-501.html',
  styleUrl: './error-501.scss'
})
export class Error501 {
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


