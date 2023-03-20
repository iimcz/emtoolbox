import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReteModule } from 'rete-angular-render-plugin';
import { PackageGraphComponent } from './package-graph/package-graph.component';
import { ExpositionListComponent } from './exposition-list/exposition-list.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { CreateExpositionDialogComponent } from './dialogs/create-exposition-dialog/create-exposition-dialog.component';
import { ExpositionDetailComponent } from './exposition-detail/exposition-detail.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MyNodeComponent } from './package-graph/node/node.component';
import { PackageDetailComponent } from './package-graph/controls/package-detail.control';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeviceDetailComponent } from './package-graph/controls/device-detail.control';
import { ConstantComponent } from './package-graph/controls/transformations/constant.control';



@NgModule({
  declarations: [
    PackageGraphComponent,
    ExpositionListComponent,
    CreateExpositionDialogComponent,
    ExpositionDetailComponent,
    MyNodeComponent,
    PackageDetailComponent,
    DeviceDetailComponent,
    ConstantComponent,
  ],
  imports: [
    CommonModule,
    ReteModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  exports: [
    PackageGraphComponent,
    ExpositionListComponent,
    ExpositionDetailComponent,
  ]
})
export class ExpositionModule { }
