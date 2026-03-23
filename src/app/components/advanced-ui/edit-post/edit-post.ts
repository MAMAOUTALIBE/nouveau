import { Component, viewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import jsonDoc from './editor';
import {
  DropzoneComponent, DropzoneDirective,
  DropzoneConfigInterface,
  DropzoneModule,
  DROPZONE_CONFIG
} from 'ngx-dropzone-wrapper';
import { QuillModule } from 'ngx-quill';
import { SpkNgSelect } from "../../../@spk/plugins/spk-ng-select/spk-ng-select";
// import { Editor, NgxEditorModule, Toolbar, Validators } from 'ngx-editor';
const DEFAULT_DROPZONE_CONFIG: DropzoneConfigInterface = {
  // Change this to your upload POST address:
  url: 'https://httpbin.org/post',
  acceptedFiles: 'image/*',
  createImageThumbnails: true
};


@Component({
  selector: 'app-edit-post',
  imports: [FormsModule, QuillModule, ReactiveFormsModule, DropzoneModule, SpkNgSelect],
  providers: [
    {
      provide: DROPZONE_CONFIG,
      useValue: DEFAULT_DROPZONE_CONFIG
    }
  ],
  templateUrl: './edit-post.html',
  styleUrl: './edit-post.scss'
})
export class EditPost {
  editorContent = `

    <h4><b class="ql-size-large">Quill Snow</b> is a free, open source <a href="https://github.com/quilljs/quill/" target="_blank">Quill Editor</a> built for the modern web. With its <a href="https://quilljs.com/docs/modules/" target="_blank">modular architecture</a> and expressive API, it is completely customizable to fit any need.</h4>
    <p><br></p>
    <ol>
      <li class="ql-size-normal">Write text select and edit with multiple options.</li>
      <li>This is quill snow editor.</li>
      <li>Easy to customize and flexible.</li>
    </ol>
    <p><br></p>
    <h4>Quill officially supports a standard toolbar theme <a href="https://github.com/quilljs/quill/" target="_blank">"Snow"</a> and a floating tooltip theme <a href="https://github.com/quilljs/quill/" target="_blank">"Bubble"</a></h4>

  `;

  editordoc = jsonDoc;
  subjects = [
    { value: 'Choice 1', label: 'Language' },
    { value: 'Choice 2', label: 'Science' },
    { value: 'Choice 3', label: 'Health' },
    { value: 'Choice 4', label: 'Humanities' },
    { value: 'Choice 5', label: 'Business' },
    { value: 'Choice 6', label: 'Maths' },
    { value: 'Choice 7', label: 'Marketing' }
  ];



  people = [
    { value: 'Choice 1', name: 'Blanche' },
    { value: 'Choice 2', name: 'Pedro Cox' },
    { value: 'Choice 3', name: 'Vera Guzman' },
    { value: 'Choice 4', name: 'Glenda Long' },
    { value: 'Choice 5', name: 'Joel Anderson' }
  ];

  selectedPerson = null; // Holds the currently selected value


  quillModules = {
    toolbar: [
      [{ 'size': ['small', false, 'large', 'huge'] }],          // Normal, Small, Large, Huge
      [{ 'font': [] }],                                        // Sans Serif, Serif, etc.
      ['bold', 'italic', 'underline', 'strike'],               // basic formatting
      ['blockquote', 'code-block'],                            // quotes & code
      [{ 'header': [1, 2, false] }],                           // H1, H2, Normal
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],           // lists
      [{ 'color': [] }],                                       // text color
      [{ 'align': [] }],                                       // alignment
      ['clean']                                                // remove formatting
    ]
  };


  public type: string = 'component';

  public disabled: boolean = false;
  public toggleType(): void {
    this.type = (this.type === 'component') ? 'directive' : 'component';
  }


  public config1: DropzoneConfigInterface = {
    clickable: true,
    maxFiles: 100,
    autoReset: null,
    errorReset: null,
    cancelReset: null
  };
  readonly componentRef = viewChild(DropzoneComponent);
  readonly directiveRef = viewChild(DropzoneDirective);

  public resetDropzoneUploads(): void {
    const directiveRef = this.directiveRef();
    const componentRef = this.componentRef();
    if (this.type === 'directive' && directiveRef) {
      directiveRef.reset();
    } else if (this.type === 'component' && componentRef && componentRef.directiveRef) {
      componentRef.directiveRef.reset();
    }
  }

}


