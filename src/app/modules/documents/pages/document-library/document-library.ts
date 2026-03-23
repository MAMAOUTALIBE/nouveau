import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { DocumentsService } from '../../documents.service';

@Component({
  selector: 'app-document-library',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './document-library.html',
})
export class DocumentLibraryPage implements OnInit {
  private documentsService = inject(DocumentsService);

  gridConfig = {
    columns: ['Référence', 'Titre', 'Type', 'Propriétaire', 'Mise à jour', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.documentsService.getDocuments().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((d) => [d.reference, d.title, d.type, d.owner, d.updatedAt, d.status]),
      };
    });
  }
}
