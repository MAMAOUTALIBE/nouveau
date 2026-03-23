import { NgxNotifierService, NgxNotifier } from 'ngx-notifier';
import { Component, inject, ViewChild } from '@angular/core';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-notification',
  imports: [SwalComponent, NgxNotifier],
  templateUrl: './notification.html',
  styleUrl: './notification.scss'
})
export class Notification {
  private toastr = inject(ToastrService);
  private ngxNotifierService = inject(NgxNotifierService);
  showDefault() {
    this.toastr.success(
      `<div class="d-flex align-items-center justify-content-between">
  <div>
    <b>Tip</b>
    <div>This is an example of tip</div>
  </div>
  <div class="float-end">
    <i class="fa fa-question-circle custom-toast-svg"></i>
  </div>
</div>
`,
      '', // Leave title empty
      {
        timeOut: 1500,
        positionClass: 'toast-bottom-right',
        toastClass: 'showDefaulttoastClass',
        enableHtml: true,
        progressBar: false,
        closeButton: false
      }
    );
  }

  showAsyncError() {
    this.toastr.success(
      `<div class="d-flex align-items-center justify-content-between">
  <div>
    <b>Tip</b>
    <div>This is an example of tip</div>
  </div>
  <div class="float-end">
    <i class="fa-solid fa-gear custom-toast-svg text-dark"></i>
  </div>
</div>
`,
      '', // Leave title empty

      {
        timeOut: 1500,
        positionClass: 'toast-bottom-right',
        toastClass: 'showDefaulttoastClass',
        progressBar: false,
        closeButton: false,
        enableHtml: true,
      }
    );

    // Delay the error toast until the success toast disappears
    setTimeout(() => {
      this.toastr.error(
        'Some error',
        'Error',
        {
          timeOut: 1510,
          positionClass: 'toast-bottom-right',
          closeButton: false
        }
      );
    }, 1600); // Slightly more than 1500ms to allow for fade-out
  }




  showAsyncSuccess() {
    this.toastr.success(
      `<div class="d-flex align-items-center justify-content-between">
  <div>
    <b>Tip</b>
    <div>This is an example of tip</div>
  </div>
  <div class="float-end">
    <i class="fa-solid fa-gear custom-toast-svg text-dark"></i>
  </div>
</div>`,
      '', // Leave title empty

      {
        timeOut: 1510,
        positionClass: 'toast-bottom-right',
        enableHtml: true,
        toastClass: 'showDefaulttoastClass',
        closeButton: false,
        progressBar: false
      }
    );

    // Delay the error toast until the success toast disappears
    setTimeout(() => {
      this.toastr.success(
        'Action has been succeeded',
        'Success',
        {
          timeOut: 1501,
          positionClass: 'toast-bottom-right',
          closeButton: false
        }
      );
    }, 1600); // Slightly more than 1500ms to allow for fade-out
  }



  info() {
    this.ngxNotifierService.createToast('Info: Some info here', 'info', 2000);
  }
  success() {
    this.ngxNotifierService.createToast('Success: Well done Details Submitted Successfully.', 'success', 2000);
  }

  warning() {
    this.ngxNotifierService.createToast('Warning: Something Went Wrong', 'warning', 2000);

  }

  error() {
    this.ngxNotifierService.createToast('Oops! An Error Occurred', 'danger', 2000);

  }

  onConfirm(): void {
    this.performPasswordReset();
  }

  performPasswordReset(): void {
    // Your actual reset logic here
  }


  @ViewChild('loadingSwal') loadingSwal!: SwalComponent;

  triggerAsyncError(): void {
    this.loadingSwal.fire(); // Show loading popup

    setTimeout(() => {
      this.loadingSwal.close(); // ✅ Close the loading popup manually

      this.toastr.error(
        'Some error',
        'Error',
        {
          timeOut: 1500,
          positionClass: 'toast-bottom-right',
          closeButton: false
        }
      );
    }, 2000); // Simulated delay
  }
  triggerAsyncSuccess(): void {
    this.loadingSwal.fire(); // Show loading popup

    setTimeout(() => {
      this.loadingSwal.close(); // ✅ Close the loading popup manually

      this.toastr.success(
        'Action has been succeeded',
        'Success',
        {
          timeOut: 1500,
          positionClass: 'toast-bottom-right',
          closeButton: false
        }
      );
    }, 2000); // Simulated delay
  }

}
