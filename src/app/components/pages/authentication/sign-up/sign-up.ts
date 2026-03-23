import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-sign-up',
    imports: [RouterModule],
    templateUrl: './sign-up.html',
    styleUrl: './sign-up.scss'
})
export class SignUp {
  constructor(){
    document.body.classList.add('error-page1', 'bg-primary');
  }
  ngOnDestroy(): void {
    document.body.classList.remove('error-page1', 'bg-primary');
  }
}


