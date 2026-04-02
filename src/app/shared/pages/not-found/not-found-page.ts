import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavService } from '../../services/nav.service';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
})
export class NotFoundPage {
  private navService = inject(NavService);

  get homePath(): string {
    return this.navService.getDefaultPath();
  }
}
