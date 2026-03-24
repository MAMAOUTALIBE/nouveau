import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SharedModule } from './shared/shared.module';
import { AppStateService } from './shared/services/app-state.service';
import { filter } from 'rxjs';
import { writeLastHealthyRoute } from './core/recovery/route-recovery';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,SharedModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Nowa');
  constructor(private appState: AppStateService, private router: Router) {
    this.appState.updateState();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => writeLastHealthyRoute(event.urlAfterRedirects || event.url));
  }
}
