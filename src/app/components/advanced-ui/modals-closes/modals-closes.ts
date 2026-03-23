import { Component, ElementRef, Renderer2, TemplateRef, ViewChild, inject, viewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import *as prismCode from "../../../shared/data/prism/advanceUi/modal&close"
import { NgbModule, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';

@Component({
  selector: 'app-modals-closes',
  imports: [ NgbModule, FormsModule, ReactiveFormsModule, ShowcodeCard],
  templateUrl: './modals-closes.html',
  styleUrl: './modals-closes.scss'
})
export class ModalsCloses {
  prismCodeData = prismCode
  @ViewChild('modal1')
  modal1!: ElementRef;
  @ViewChild('modal2')
  modal2!: ElementRef;

  constructor(private modalService: NgbModal, private renderer: Renderer2) { }

  ngOnInit(): void { }

  openScale(modal: TemplateRef<HTMLElement>) {
    this.modalService.open(modal, {
      centered: true,
      windowClass: 'effect-scale',
    });
  }

  openSlideRight(modal: TemplateRef<HTMLElement>) {
    this.modalService.open(modal, {
      centered: true,
      windowClass: 'effect-slide-in-right',
    });
  }

  openSlideBottom(modal: TemplateRef<HTMLElement>) {
    this.modalService.open(modal, {
      centered: true,
      windowClass: 'effect-slide-in-bottom',
    });
  }
  openNewspaper(modal: TemplateRef<HTMLElement>) {
    this.modalService.open(modal, {
      centered: true,
      windowClass: 'effect-newspaper',
    });
  }
  openFall(modal: TemplateRef<HTMLElement>) {
    this.modalService.open(modal, {
      centered: true,
      windowClass: 'effect-fall',
    });
  }
  openFlipHorizontal(modal: TemplateRef<HTMLElement>) {
    this.modalService.open(modal, {
      centered: true,
      windowClass: 'effect-flip-horizontal',
    });
  }
  openFlipVertical(modal: TemplateRef<HTMLElement>) {
    this.modalService.open(modal, {
      centered: true,
      windowClass: 'effect-flip-vertical',
    });
  }
  openSuperScaled(modal: TemplateRef<HTMLElement>) {
    this.modalService.open(modal, {
      centered: true,
      windowClass: ' effect-super-scaled',
    });
  }
  openSign(modal: TemplateRef<HTMLElement>) {
    this.modalService.open(modal, {
      centered: true,
      windowClass: 'effect-sign',
    });
  }
  openRotateBottom(modal: TemplateRef<HTMLElement>) {
    this.modalService.open(modal, {
      centered: true,
      windowClass: 'effect-rotate-bottom',
    });
  }
  openRotateLeft(modal: TemplateRef<HTMLElement>) {
    this.modalService.open(modal, {
      centered: true,
      windowClass: 'effect-rotate-left',
    });
  }

  openJustMe(justme: any) {
    this.modalService.open(justme, {
      centered: true,
      windowClass: 'dark-modal',
    });
  }

  openright(right: any) {
    this.modalService.open(right, { centered: true });
  }

  openBasic(basicModal: TemplateRef<HTMLElement>) {
    this.modalService.open(basicModal);
  }

  StaticBackdrop(staticbackdropModal: TemplateRef<HTMLElement>) {
    this.modalService.open(staticbackdropModal, { backdrop: 'static' });
  }

  VerticalCenter(VerticalCenterModal: TemplateRef<HTMLElement>) {
    this.modalService.open(VerticalCenterModal, { centered: true });
  }

  GridOpen(gridModal: TemplateRef<HTMLElement>) {
    this.modalService.open(gridModal, { size: 'lg' });
  }

  SuccessOpen(successModal: TemplateRef<HTMLElement>) {
    this.modalService.open(successModal, { centered: true });
  }

  WarningOpen(warningModal: TemplateRef<HTMLElement>) {
    this.modalService.open(warningModal, { centered: true });
  }

  Select2Open(select2Modal: TemplateRef<HTMLElement>) {
    this.modalService.open(select2Modal, { size: 'sm' });
  }

  openScrollable(scrollModal: TemplateRef<HTMLElement>) {
    this.modalService.open(scrollModal, { scrollable: true });
  }

  scrollableContent(ScrollingcontentModal: TemplateRef<HTMLElement>) {
    this.modalService.open(ScrollingcontentModal, { scrollable: true });
  }

  VerticalCenterScroll(VerticalCenterScrollModal: TemplateRef<HTMLElement>) {
    this.modalService.open(VerticalCenterScrollModal, { scrollable: true });
  }
  TooltipPopovers(TooltipPopoversModal: TemplateRef<HTMLElement>) {
    this.modalService.open(TooltipPopoversModal, { centered: true });
  }

  Gridmodal(GridCenterModal: TemplateRef<HTMLElement>) {
    this.modalService.open(GridCenterModal, { centered: true });
  }
  togglemodal(ToggleModal: TemplateRef<HTMLElement>) {
    this.modalService.open(ToggleModal, { centered: true });
  }

  togglemodal2(ToggleModal2: any) {
    this.modalService.open(ToggleModal2, { centered: true });
  }

  openSm(SmallModal: TemplateRef<HTMLElement>) {
    this.modalService.open(SmallModal, { size: 'sm' });
  }
  openXl(XlContentModal: TemplateRef<HTMLElement>) {
    this.modalService.open(XlContentModal, { size: 'xl' });
  }
  openLg(LargeModal: TemplateRef<HTMLElement>) {
    this.modalService.open(LargeModal, { size: 'lg' });
  }
  openFullscreen(FullscreenModal: TemplateRef<HTMLElement>) {
    this.modalService.open(FullscreenModal, { fullscreen: true });
  }
  BelowSm(BelowSmModal: TemplateRef<HTMLElement>) {
    this.modalService.open(BelowSmModal);
  }
  BelowMd(BelowMdModal: TemplateRef<HTMLElement>) {
    this.modalService.open(BelowMdModal);
  }
  BelowLg(BelowLgModal: TemplateRef<HTMLElement>) {
    this.modalService.open(BelowLgModal);
  }
  BelowXl(BelowXlModal: TemplateRef<HTMLElement>) {
    this.modalService.open(BelowXlModal);
  }
  BelowXxl(BelowXxlModal: TemplateRef<HTMLElement>) {
    this.modalService.open(BelowXxlModal);
  }
  Openmdo(OpenmdoModal: TemplateRef<HTMLElement>) {
    this.modalService.open(OpenmdoModal);
  }
  Openfat(OpenfatModal: TemplateRef<HTMLElement>) {
    this.modalService.open(OpenfatModal);
  }
  Opengetbootstrap(OpengetbootstrapModal: TemplateRef<HTMLElement>) {
    this.modalService.open(OpengetbootstrapModal);
  }

  // Define modal options
  modalOptions: NgbModalOptions = {
    centered: true
  };


  private firstModalRef: any;
  private secondModalRef: any;

  openFirstModal(content1: any) {
    // Close the second modal if it's open
    if (this.secondModalRef) {
      this.secondModalRef.close();
    }

    // Open the first modal
    const modalRef = this.modalService.open(content1, this.modalOptions);
    this.firstModalRef = modalRef;

    modalRef.result.then((result) => {
      // Handle modal close event if needed
    }).catch((reason) => {
      // Handle modal dismiss event if needed
    });
  }

  openSecondModal(content1: any, content2: any) {
    // Close the first modal if it's open
    if (this.firstModalRef) {
      this.firstModalRef.close();
    }

    const modalRef = this.modalService.open(content2, this.modalOptions);
    this.secondModalRef = modalRef;

    modalRef.result.then((result) => {
      // Handle modal close event if needed
    }).catch((reason) => {
      // Handle modal dismiss event if needed
    });
  }

}


