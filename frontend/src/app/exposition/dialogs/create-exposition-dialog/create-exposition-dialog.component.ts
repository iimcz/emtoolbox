import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ExpositionProperties } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-create-exposition-dialog',
  templateUrl: './create-exposition-dialog.component.html',
  styleUrls: ['./create-exposition-dialog.component.css']
})
export class CreateExpositionDialogComponent {
  @Output() onConfirmExposition = new EventEmitter<ExpositionProperties>();

  dialogFG = this.fb.group({
    name: this.fb.control('', {nonNullable: true}),
    description: this.fb.control('', { nonNullable: true }),
    startDate: [''],
    endDate: ['']
  });

  constructor(
    private fb: FormBuilder,
  ) { }

  createExposition() {
    this.onConfirmExposition.emit({
      name: this.dialogFG.get('name')?.value,
      description: this.dialogFG.get('description')?.value,
      startDate: new Date(this.dialogFG.get('startDate')?.value),
      endDate: new Date(this.dialogFG.get('endDate')?.value)
    } as ExpositionProperties);
  }
}
