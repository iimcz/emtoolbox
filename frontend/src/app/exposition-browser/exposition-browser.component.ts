import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CreateExpositionDialogComponent } from '../exposition/dialogs/create-exposition-dialog/create-exposition-dialog.component';
import { ExpositionClient } from '../services/api.generated.service';

@Component({
  selector: 'app-exposition-browser',
  templateUrl: './exposition-browser.component.html',
  styleUrls: ['./exposition-browser.component.css']
})
export class ExpositionBrowserComponent {
  constructor(
    private dialog: MatDialog,
    private expositionClient: ExpositionClient,
    private router: Router
  ) { }

  openCreationDialog() {
    let crDialog = this.dialog.open(CreateExpositionDialogComponent);
    crDialog.componentInstance.onConfirmExposition.subscribe(value => {
      this.expositionClient.new(value).subscribe(exp => {
        crDialog.close();
        this.router.navigate(['exposition', exp.id]);
      })
    })
  }

}
