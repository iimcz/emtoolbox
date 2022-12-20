import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PackageProperties } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-package-selection-dialog',
  templateUrl: './package-selection-dialog.component.html',
  styleUrls: ['./package-selection-dialog.component.css']
})
export class PackageSelectionDialogComponent implements OnInit {
  @Output() onPackageSelected = new EventEmitter<PackageProperties>();

  ngOnInit(): void {
  }

  packageSelected(pkg) {
    this.onPackageSelected.emit(pkg);
  }
}
