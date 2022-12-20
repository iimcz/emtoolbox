import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PackageListComponent } from './package-list/package-list.component';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { PackageAssignmentComponent } from './package-assignment/package-assignment.component';
import { PackageSelectionDialogComponent } from './package-selection-dialog/package-selection-dialog.component';
import { OverlayDetailComponent } from './overlay-detail/overlay-detail.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';



@NgModule({
  declarations: [
    PackageListComponent,
    PackageAssignmentComponent,
    PackageSelectionDialogComponent,
    OverlayDetailComponent
  ],
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatTabsModule,
    ReactiveFormsModule
  ],
  exports: [
    PackageListComponent,
    PackageSelectionDialogComponent,
    OverlayDetailComponent,
  ]
})
export class OverlaysModule { }
