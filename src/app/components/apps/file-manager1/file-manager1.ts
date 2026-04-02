import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { SpkDropdowns } from "../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";
interface FileItem {
  id: number;
  name: string;
  size: string;
  icon: string;
  isFolder?: boolean;
  isImage?: boolean;     // helps with conditional mt-2 class
}
@Component({
  selector: 'app-file-manager1',
  imports: [ RouterLink,  SpkDropdowns],
  templateUrl: './file-manager1.html',
  styleUrl: './file-manager1.scss'
})
export class FileManager1 {
  files: FileItem[] = [
    { id: 1, name: 'videos', size: '4.23gb', icon: './assets/images/files/folder.png', isFolder: true },
    { id: 2, name: 'Images', size: '1.23gb', icon: './assets/images/files/folder.png', isFolder: true },
    { id: 3, name: 'Downloads', size: '453kb', icon: './assets/images/files/folder.png', isFolder: true },
    { id: 4, name: 'document.pdf', size: '23kb', icon: './assets/images/files/file.png' },
    { id: 5, name: 'document.pdf', size: '23kb', icon: './assets/images/files/file.png' },
    { id: 6, name: 'Word document', size: '23kb', icon: './assets/images/files/word.png' },
    { id: 7, name: 'document.pdf', size: '23kb', icon: './assets/images/files/file.png' },
    { id: 8, name: 'document.pdf', size: '23kb', icon: './assets/images/files/file.png' },
    { id: 9, name: 'Downloads', size: '453kb', icon: './assets/images/files/folder.png', isFolder: true },
    { id: 10, name: 'document.pdf', size: '23kb', icon: './assets/images/files/file.png' },
    { id: 11, name: 'document.pdf', size: '23kb', icon: './assets/images/files/file.png' },
    { id: 12, name: 'Downloads', size: '453kb', icon: './assets/images/files/folder.png', isFolder: true },
    { id: 13, name: 'Document', size: '23kb', icon: './assets/images/files/doc.png' },
    { id: 14, name: 'login image', size: '23kb', icon: './assets/images/files/image.png', isImage: true },
    { id: 15, name: 'beach image', size: '4.23gb', icon: './assets/images/files/image.png', isImage: true },
    { id: 16, name: 'sky image', size: '1.23gb', icon: './assets/images/files/image.png', isImage: true },
    { id: 17, name: 'Sea', size: '897mb', icon: './assets/images/files/image.png', isImage: true },
    { id: 18, name: 'Outdoor Image', size: '23kb', icon: './assets/images/files/image.png', isImage: true },
  ];
}


