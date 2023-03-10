import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceListComponent } from './device-list/device-list.component';
import { DeviceDetailComponent } from './device-detail/device-detail.component';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SensorSelectionDialogComponent } from './dialogs/sensor-selection-dialog/sensor-selection-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';



@NgModule({
  declarations: [
    DeviceListComponent,
    DeviceDetailComponent,
    SensorSelectionDialogComponent
  ],
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCheckboxModule,
    MatDialogModule,
    MatInputModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatExpansionModule,
  ],
  exports: [
    DeviceListComponent,
    DeviceDetailComponent,
  ]
})
export class InventoryModule { }
