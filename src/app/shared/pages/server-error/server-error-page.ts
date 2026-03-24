import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-server-error-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './server-error-page.html',
  styleUrl: './server-error-page.scss',
})
export class ServerErrorPage {}
