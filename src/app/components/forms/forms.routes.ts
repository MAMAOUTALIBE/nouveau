import { Routes } from '@angular/router';

export const formsRoutingModule: Routes = [
  {
    path: 'forms', children: [{
      path: 'form-layouts',
      loadComponent: () => import('./forms-layout/forms-layout').then((m) => m.FormsLayout),
      title: 'Nowa - Form Layouts',
      data: { parentTitle: 'Forms', subParentTitle: '', childTitle: 'Form Layouts' }
    },
    {
      path: 'floating-labels',
      loadComponent: () => import('./floating-labels/floating-labels').then((m) => m.FloatingLabels),
      title: 'Noa - Floating Labels',
      data: { parentTitle: 'Forms', subParentTitle: '', childTitle: 'Floating Labels' }
    },
    {
      path: 'form-elements',
      children: [
        {
          path: 'inputs',
          loadComponent: () => import('./form-elements/inputs/inputs').then((m) => m.Inputs),
          title: 'Nowa  Inputs',
          data: { parentTitle: 'Forms', subParentTitle: 'Form Elements', childTitle: 'Inputs' }
        },
        {
          path: 'checks-radios',
          loadComponent: () => import('./form-elements/checksradios/checksradios').then((m) => m.Checksradios),
          title: 'Nowa - Checks-radios',
          data: { parentTitle: 'Forms', subParentTitle: 'Form Elements', childTitle: 'Checks & Radios' }
        },
        {
          path: 'inputgroup',
          loadComponent: () => import('./form-elements/inputgroup/inputgroup').then((m) => m.Inputgroup),
          title: 'Nowa - Input Group',
          data: { parentTitle: 'Forms', subParentTitle: 'Form Elements', childTitle: 'Input Group' }
        },
        {
          path: 'formselect',
          loadComponent: () => import('./form-elements/formselect/formselect').then((m) => m.Formselect),
          title: 'Nowa - Formselect',
          data: { parentTitle: 'Forms', subParentTitle: 'Form Elements', childTitle: 'Formselect' }
        },
        {
          path: 'file-uploads',
          loadComponent: () => import('./form-elements/fileuploads/fileuploads').then((m) => m.Fileuploads),
          title: 'Nowa - File uploads',
          data: { parentTitle: 'Forms', subParentTitle: 'Form Elements', childTitle: 'File uploads' }
        },

        {
          path: 'datetimepicker',
          loadComponent: () => import('./form-elements/datetimepicker/datetimepicker').then((m) => m.Datetimepicker),
          title: 'Nowa - Date & Time pickers',
          data: { parentTitle: 'Forms', subParentTitle: 'Form Elements', childTitle: 'Date & Time pickers' }
        },
        {
          path: 'color-pickers',
          loadComponent: () => import('./form-elements/colorpicker/colorpicker').then((m) => m.Colorpicker),
          title: 'Nowa - Color Pickers',
          data: { parentTitle: 'Forms', subParentTitle: 'Form Elements', childTitle: 'Color Pickers' }
        },
        {
          path: 'inputs',
          loadComponent: () => import('./form-elements/inputs/inputs').then((m) => m.Inputs),
          title: 'Nowa - Inputs',
          data: { parentTitle: 'Forms', subParentTitle: 'Form Elements', childTitle: 'Inputs' }
        },
        {
          path: 'range-slider',
          loadComponent: () => import('./form-elements/rangeslider/rangeslider').then((m) => m.Rangeslider),
          title: 'Nowa - Range Slider',
          data: { parentTitle: 'Forms', subParentTitle: 'Form Elements', childTitle: 'Range Slider' }
        },
        {
          path: 'inputmask',
          loadComponent: () => import('./form-elements/input-mask/input-mask').then((m) => m.InputMask),
          title: 'Nowa - INPUT MASKS',
          data: { parentTitle: 'Forms', subParentTitle: 'Form Elements', childTitle: 'INPUT MASKS' }
        },
      ]
    },
    {
      path: 'form-editor',
      children: [
        {
          path: 'quill-editor',
          loadComponent: () => import('./form-editors/quill-editor/quill-editor').then((m) => m.QuillEditor),
          title: 'Nowa - Quill Editor',
          data: { parentTitle: 'Forms', subParentTitle: '', childTitle: 'Quill Editors' }
        },]
    },
    {
      path: 'validation',
      loadComponent: () => import('./validation/validation').then((m) => m.Validation),
      title: 'Nowa - Validation',
      data: { parentTitle: 'Forms', subParentTitle: '', childTitle: 'Validation' }
    },
    {
      path: 'select2',
      loadComponent: () => import('./select2/select2').then((m) => m.Select2),
      title: 'Nowa - Select2',
      data: { parentTitle: 'Forms', subParentTitle: '', childTitle: 'Select2' }
    },
    ]
  }
];
