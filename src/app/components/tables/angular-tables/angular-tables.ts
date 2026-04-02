import { Component } from '@angular/core';
import * as datatable from './table-data';
import { MaterialModuleModule } from '../../../material-module/material-module.module';
import { SpkAngularMaterialTables } from "../../../@spk/tables/spk-angular-material-tables/spk-angular-material-tables";

@Component({
  selector: 'app-angular-tables',
  imports: [ MaterialModuleModule, SpkAngularMaterialTables],
  templateUrl: './angular-tables.html',
  styleUrl: './angular-tables.scss'
})
export class AngularTables {

  datatableData: typeof datatable = datatable;

}
