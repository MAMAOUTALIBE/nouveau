import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-sign-in',
    imports: [ RouterModule, NgbNavModule],
    templateUrl: './sign-in.html',
    styleUrl: './sign-in.scss'
})
export class SignIn {

  constructor(){
    document.body.classList.add('error-page1', 'bg-primary');
  }
  ngOnDestroy(): void {
    document.body.classList.remove('error-page1', 'bg-primary');
  }
}


