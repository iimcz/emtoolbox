import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ExpositionClient, ExpositionMeta, ExpositionProperties } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-exposition-detail',
  templateUrl: './exposition-detail.component.html',
  styleUrls: ['./exposition-detail.component.css']
})
export class ExpositionDetailComponent implements OnInit, OnChanges{
  @Input() expositionId: number;

  displayedColumns = ['key', 'value', 'del'];
  metadataDataSource = new MatTableDataSource<ExpositionMeta>();

  detailFG: FormGroup = this.fb.group({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    metaKey: '',
    metaValue: ''
  });

  constructor(
    private fb: FormBuilder,
    private expositionClient: ExpositionClient)
  { }

  ngOnChanges(_: SimpleChanges): void {
    this.loadExpositionDetails();
  }

  loadExpositionDetails() {
    this.expositionClient.getProperties(this.expositionId).subscribe(data => {
      this.detailFG.get('name').setValue(data.name);
      this.detailFG.get('description').setValue(data.description);
      this.detailFG.get('startDate').setValue(data.startDate);
      this.detailFG.get('endDate').setValue(data.endDate);

      this.metadataDataSource.data = data.metadata;
    });
  }

  addNewMetadata() {
    this.metadataDataSource.data.push({
      key: this.detailFG.get('metaKey').value,
      value: this.detailFG.get('metaValue').value,
    } as ExpositionMeta);
    this.metadataDataSource.data = this.metadataDataSource.data;
  }

  deleteMetadata(meta: ExpositionMeta) {
    let data = this.metadataDataSource.data.filter(v => v.key != meta.key);
    this.metadataDataSource.data = data;
  }

  ngOnInit(): void {
    
  }

  public saveDetails() {
    this.expositionClient.setProperties(this.expositionId, {
      name: this.detailFG.get('name')?.value,
      description: this.detailFG.get('description')?.value,
      startDate: new Date(this.detailFG.get('startDate')?.value),
      endDate: new Date(this.detailFG.get('endDate')?.value),
      metadata: this.metadataDataSource.data
    } as ExpositionProperties).subscribe(
      _ => { /* IGNORE */ }
    );
  }
}