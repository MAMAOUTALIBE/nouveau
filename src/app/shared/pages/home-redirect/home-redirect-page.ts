import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavService } from '../../services/nav.service';

@Component({
  selector: 'app-home-redirect-page',
  standalone: true,
  template: '',
})
export class HomeRedirectPage implements OnInit {
  private router = inject(Router);
  private navService = inject(NavService);

  ngOnInit(): void {
    void this.router.navigateByUrl(this.navService.getDefaultPath(), { replaceUrl: true });
  }
}
