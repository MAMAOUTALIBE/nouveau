import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavService } from '../../services/nav.service';

@Component({
  selector: 'app-server-error-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './server-error-page.html',
  styleUrl: './server-error-page.scss',
})
export class ServerErrorPage {
  private navService = inject(NavService);

  get homePath(): string {
    return this.navService.getDefaultPath();
  }
}
