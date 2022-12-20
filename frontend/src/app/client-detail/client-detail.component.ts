import { Component, Input, OnInit, ɵɵqueryRefresh } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExhibitClient, PackageClient } from '../services/api.generated.service';

@Component({
  selector: 'app-client-detail',
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.css']
})
export class ClientDetailComponent implements OnInit {
  id: string;
  availablePackages: string[];

  constructor(
    private route: ActivatedRoute,
    private exhibitClient: ExhibitClient,
    private packageClient: PackageClient,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.id = params['id'];

      this.refresh();
    });
  }

  refresh(): void {
  }

  clearPackage(): void {
    this.packageClient.clearPackage(this.id).subscribe();
  }

  loadPackage(pkg: string): void {
    this.packageClient.loadPackage(this.id, pkg).subscribe();
  }
}
