import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ExhibitClient, ExpositionClient, ExpositionProperties } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-exposition-list',
  templateUrl: './exposition-list.component.html',
  styleUrls: ['./exposition-list.component.css']
})
export class ExpositionListComponent implements OnInit, AfterViewInit {
  @Input() searchTerm: string = "";

  displayedColumns: string[] = ['id', 'name', 'desc', 'startd', 'endd', 'actions'];
  expDataSource = new MatTableDataSource<ExpositionProperties>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private expositionClient: ExpositionClient,
    private deviceClient: ExhibitClient,
  ) { }

  ngOnInit(): void {
    this.expositionClient.getAll().subscribe(data => {
      this.expDataSource.sort = this.sort;
      this.expDataSource.paginator = this.paginator;
      this.expDataSource.data = data;
    });
  }

  ngAfterViewInit(): void {
    this.expDataSource.filterPredicate = this.doFilter;
  }

  doFilter(data: ExpositionProperties, filter: string): boolean {
    // TODO: use searchTerm
    return true;
  }

  doEdit(exp: ExpositionProperties) {
    this.router.navigate(['exposition', exp.id]);
  }

  doUpload(exp: ExpositionProperties) {
    this.deviceClient.sendPackages(exp.id);
  }
}
