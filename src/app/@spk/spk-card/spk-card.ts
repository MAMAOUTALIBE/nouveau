import { CommonModule } from '@angular/common';
import {  Component, ContentChild, effect, ElementRef, input,  } from '@angular/core';
import {  NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'spk-card',
  imports: [CommonModule, NgbCollapseModule],
  templateUrl: './spk-card.html',
  styleUrl: './spk-card.scss'
})
export class SpkCard {
  cardtitle = input<string>('');
  cardClass = input<string>('');         // Signal input for card class

  cardheaderClass = input<string>('');   // Signal input for card-header class
  cardBodyClass = input<string>('');     // Signal input for card-body class
  cardFooterClass = input<string>('');
  iconClass = input<string>('');
  afterHeaderClass = input<string>('');

  cardOptions = input<boolean>()
  collapsable = input<boolean>()
  fullScreenable=input<boolean>()
  closeable = input<boolean>()
  switchable= input<boolean>()





  hasHeader = false;
  hasFooter = false;
  isClosed = false;
  isCollapsed = false;
  initialCollapsedCard=input<boolean>();

  constructor(){
    effect(() => {
      if(this.initialCollapsedCard()){
        this.isCollapsed=!this.isCollapsed
      }
    });
  }


  @ContentChild('footer', { static: false }) footerContent!: ElementRef;
  @ContentChild('header', { static: false }) headerContent!: ElementRef;

  ngAfterContentInit() {
    this.hasHeader = !!this.headerContent;
    this.hasFooter = !!this.footerContent;
  }



  Closetoggle() {
    this.isClosed = true
    console.log(this.isClosed)
  }


  toggleClass = "fe fe-maximize";
  fullScreenToggle() {
    if (this.toggleClass === "fe fe-maximize") {
      this.toggleClass = "fe fe-minimize";
    } else {
      this.toggleClass = "fe fe-maximize";
    }
  }


}

