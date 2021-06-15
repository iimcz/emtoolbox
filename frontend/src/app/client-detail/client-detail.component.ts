import { Component, Input, OnInit, ɵɵqueryRefresh } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConnectionClient, PackageClient } from '../services/api.generated.service';

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
    private connectionClient: ConnectionClient,
    private packageClient: PackageClient,
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.id = params['id'];

      this.refresh();
    });
  }

  refresh(): void {
    this.packageClient.getAvailable().subscribe(packages => {
      this.availablePackages = packages;
    });
  }

  clearPackage(): void {
    this.packageClient.clearPackage(this.id).subscribe();
  }

  loadPackage(pkg: string): void {
    this.packageClient.loadPackage(this.id, pkg).subscribe();
  }
}
