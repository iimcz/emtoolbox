import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ExpositionDetailComponent } from '../exposition/exposition-detail/exposition-detail.component';
import { PackageGraphComponent } from '../exposition/package-graph/package-graph.component';
import { CheckedEvent } from '../inventory/device-list/device-list.component';
import { Convert, Settings, Element } from '../model/package';
import { CustomInput, CustomOutput } from '../overlays/overlay-detail/overlay-detail.component';
import { PackageSelectionDialogComponent } from '../overlays/package-selection-dialog/package-selection-dialog.component';
import { ExhibitClient, ExhibitProperties, ExpositionClient, PackageOverlayProperties, PackageProperties } from '../services/api.generated.service';

@Component({
  selector: 'app-exposition-editor',
  templateUrl: './exposition-editor.component.html',
  styleUrls: ['./exposition-editor.component.css']
})
export class ExpositionEditorComponent implements OnInit {
  @ViewChild('detailComponent') detail: ExpositionDetailComponent;
  @ViewChild('graphComponent') graph: PackageGraphComponent;
  expositionId: number;
  expositionName: string;

  selectedPackage: PackageProperties;
  selectedOverlay: PackageOverlayProperties;
  selectedExhibit: string;

  checkedDevicesForMultidevice: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private expositionClient: ExpositionClient,
    private deviceClient: ExhibitClient,
    private dialog: MatDialog,
  ) {
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.expositionId = parseInt(params.get('id'));
      this.expositionClient.getProperties(this.expositionId).subscribe(data => this.expositionName = data.name);
    })
  }

  save(): void {
    this.detail.saveDetails();
    this.graph.saveGraph();

    // TODO: better handle sync

    let exhibits = this.graph.getIncludedExhibits();
    let syncMaster: ExhibitProperties = null;
    for (let exhibit_id of exhibits) {
      let exhibit = this.graph.getExhibit(exhibit_id) as ExhibitProperties;
      let overlay = this.graph.getOverlay(exhibit_id);
      let inputs = this.graph.getOverlayInputs(exhibit_id);

      if (!syncMaster) {
        syncMaster = exhibit;
      }

      overlay.inputs = inputs;
      if (!overlay.sync) {
        let canvas = exhibit.tags.includes('ipw') ? { width: 4096, height: 2048 } : { width: 2048, height: 2048 };
        let elements: Element[] = [];

        if (exhibit == syncMaster) {
          elements.push({
            hostname: exhibit.hostname,
            role: '',
            viewportTransform: canvas.width + 'x' + canvas.height + '+0+0'
          });
        } else {
          elements.push({
            hostname: syncMaster.hostname,
            role: '',
            viewportTransform: '1x1+0+0'
          });
          elements.push({
            hostname: exhibit.hostname,
            role: '',
            viewportTransform: canvas.width + 'x' + canvas.height + '+0+0'
          })
        }
        
        overlay.sync = Convert.syncToJson({
          canvasDimensions: canvas,
          selfIndex: 0,
          elements: elements
        })
      }
      
      this.expositionClient.setPackageOverlay(this.expositionId, exhibit_id, overlay).subscribe(_ => { /* IGNORE */});
    }
  }

  upload(): void {
    this.deviceClient.sendPackages(this.expositionId).subscribe(_ => { /* IGNORE */ });
  }

  addSingleDevice(device: string) {
    this.graph.addSingleDevice(device);
  }

  addMultiDevice() {
    this.graph.addMultiDevice(this.checkedDevicesForMultidevice);
  }

  selectPackage() {
    let selectDialog = this.dialog.open(PackageSelectionDialogComponent);
    selectDialog.componentInstance.onPackageSelected.subscribe(pkg => {
      this.selectedPackage = pkg;
      selectDialog.close();

      if (this.selectedExhibit) {
        this.graph.setPackage(this.selectedExhibit, this.selectedPackage);

        this.expositionClient.getPackageOverlay(this.expositionId, this.selectedExhibit).subscribe(data => {
          data.packageId = this.selectedPackage.id;
          this.graph.setOverlay(this.selectedExhibit, data);
        }, error => {
          this.graph.setOverlay(this.selectedExhibit, {
            packageId: this.selectedPackage.id,
            overwriteInputs: false,
            overwriteSettings: false,
            inputs: '',
            settings: '',
            sync: '',
          } as PackageOverlayProperties);
        })
      }
    });
  }

  selectExhibit(exhibit: string) {
    this.selectedExhibit = exhibit;
    this.selectedPackage = this.graph.getPackage(exhibit);
    this.selectedOverlay = this.graph.getOverlay(exhibit);
  }

  addCustomInput(input: CustomInput) {
    this.graph.addCustomInput(this.selectedExhibit, input);
  }

  addCustomOutput(output: CustomOutput) {
    this.graph.addCustomOutput(this.selectedExhibit, output);
  }

  deviceCheckChanged(event: CheckedEvent) {
    if (event.checked) {
      this.checkedDevicesForMultidevice.push(event.hostname);
    } else {
      this.checkedDevicesForMultidevice = this.checkedDevicesForMultidevice.filter(ex => ex != event.hostname);
    }
  }

  settingsChanged(settings: Settings) {
    throw new Error('Method not implemented.');
  }

  overlayChanged(overlay: PackageOverlayProperties) {
    this.selectedOverlay.overwriteInputs = overlay.overwriteInputs;
    this.selectedOverlay.overwriteSettings = overlay.overwriteSettings;
    this.graph.setOverlay(this.selectedExhibit, this.selectedOverlay);
  }
}
