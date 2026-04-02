import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavService } from '../../services/nav.service';

@Component({
  selector: 'app-forbidden-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './forbidden-page.html',
  styleUrl: './forbidden-page.scss',
})
export class ForbiddenPage {
  private navService = inject(NavService);

  get homePath(): string {
    return this.navService.getDefaultPath();
  }
}
