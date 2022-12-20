import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PackageClient, PackageProperties, PackageType } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-package-list',
  templateUrl: './package-list.component.html',
  styleUrls: ['./package-list.component.css']
})
export class PackageListComponent implements OnInit{
  @Output() onPackageSelected = new EventEmitter<PackageProperties>();

  packageDataSource = new MatTableDataSource<PackageProperties>();
  displayedColumns = ['id', 'name', 'desc', 'type'];

  constructor(
    private packageClient: PackageClient
  ) { }

  ngOnInit(): void {
    this.packageClient.getAvailable().subscribe(data => {
      this.packageDataSource.data = data;
    })
  }

  selectPackage(pkg: PackageProperties) {
    this.onPackageSelected.emit(pkg);
  }
  
  selectIcon(type: PackageType): string {
    switch (type) {
      case PackageType.Gallery:
        return 'image';
      case PackageType.Model:
        return 'view_in_ar';
      case PackageType.Scene:
        return 'grain';
      case PackageType.Video:
        return 'movie';
      case PackageType.Panorama:
        return 'panorama_horizontal';
    }
  }
}
