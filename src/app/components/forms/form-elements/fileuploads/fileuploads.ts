import { Component, ViewChild, viewChild } from '@angular/core';
import { FilePondComponent, FilePondModule, registerPlugin } from 'ngx-filepond';
import * as FilePond from 'filepond';
import { NgxDropzoneModule } from 'ngx-dropzone';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType)
import {
  DropzoneConfigInterface,
  DropzoneModule,
  DROPZONE_CONFIG,
  DropzoneComponent,
  DropzoneDirective
} from 'ngx-dropzone-wrapper';


const DEFAULT_DROPZONE_CONFIG: DropzoneConfigInterface = {
  // Change this to your upload POST address:
  url: 'https://httpbin.org/post',
  maxFilesize: 50,
  acceptedFiles: 'image/*'
};

@Component({
  selector: 'app-fileuploads',
  imports: [FilePondModule, DropzoneModule, NgxDropzoneModule],
  providers: [
    {
      provide: DROPZONE_CONFIG,
      useValue: DEFAULT_DROPZONE_CONFIG
    }
  ],
  templateUrl: './fileuploads.html',
  styleUrl: './fileuploads.scss'
})
export class Fileuploads {
  @ViewChild(DropzoneComponent, { static: false }) componentRef?: DropzoneComponent;
  @ViewChild(DropzoneDirective, { static: false }) directiveRef?: DropzoneDirective;
  public toggleType(): void {
    this.type = (this.type === 'component') ? 'directive' : 'component';
  }

  myPond = viewChild<FilePondComponent>("myPond");

  pondOptions: FilePond.FilePondOptions = {
    maxFiles: 5,
    allowMultiple: true,
    labelIdle: "Drop files here to Upload...",
    acceptedFileTypes: ['image/*'], // Allows only image files
    stylePanelLayout: 'compact', // Panel layout style
    allowImagePreview: false, // Enable image preview
    allowFileTypeValidation: true, // Validate file types
  };

  singlepondOptions: FilePond.FilePondOptions = {
    allowMultiple: false,
    labelIdle: "Drop files here to Upload...",
    acceptedFileTypes: ['image/*'], // Allows only image files
    imagePreviewHeight: 170,
    stylePanelLayout: 'compact',
    allowImagePreview: true,
    allowFileTypeValidation: true,
  };

  pondFiles: FilePond.FilePondOptions["files"] = [];


  public type: string = 'component';

  public disabled: boolean = false;

  public config: DropzoneConfigInterface = {
    clickable: true,
    maxFiles: 100,
    autoReset: null,
    errorReset: null,
    cancelReset: null
  };

  public onUploadInit(args: any): void {
  }

  public onUploadError(args: any): void {
  }

  public onUploadSuccess(args: any): void {
  }
}


