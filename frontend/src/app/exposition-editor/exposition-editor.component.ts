import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ExpositionDetailComponent } from '../exposition/exposition-detail/exposition-detail.component';
import { PackageGraphComponent } from '../exposition/package-graph/package-graph.component';
import { CheckedEvent } from '../inventory/device-list/device-list.component';
import { SensorSelectionDialogComponent } from '../inventory/dialogs/sensor-selection-dialog/sensor-selection-dialog.component';
import { Settings } from '../model/package';
import { CustomInput, CustomOutput } from '../overlays/overlay-detail/overlay-detail.component';
import { PackageSelectionDialogComponent } from '../overlays/package-selection-dialog/package-selection-dialog.component';
import { ExhibitClient, ExhibitProperties, ExpositionClient, NewOverlayProperties, PackageOverlayProperties, PackageProperties } from '../services/api.generated.service';

@Component({
  selector: 'app-exposition-editor',
  templateUrl: './exposition-editor.component.html',
  styleUrls: ['./exposition-editor.component.css']
})
export class ExpositionEditorComponent implements OnInit {
  @ViewChild('detailComponent') detail: ExpositionDetailComponent;
  @ViewChild('graphComponent') graph: PackageGraphComponent;
  @ViewChild('deviceTabGroup') deviceTabGroup: MatTabGroup;
  @ViewChild('packageTabGroup') packageTabGroup: MatTabGroup;
  @ViewChild('startupPackageSelect') startupPackageSelect: MatSelect;
  expositionId: number;
  expositionName: string;

  selectedPackages: PackageProperties[];
  selectedOverlays: PackageOverlayProperties[];
  selectedExhibits: ExhibitProperties[];
  
  startupPackageId = 0;

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
      let exhibit = this.graph.getExhibit(exhibit_id);
      let overlays = this.graph.getOverlays(exhibit_id);

      if (!syncMaster) {
        syncMaster = exhibit;
      }

      // for (let overlay of overlays) {
      //   let inputs = this.graph.getOverlayInputs(exhibit_id, overlay.id);
      // }

      // overlay.inputs = inputs;
      // if (!overlay.sync) {
      //   let canvas = exhibit.tags.includes('ipw') ? { width: 4096, height: 2048 } : { width: 2048, height: 2048 };
      //   let elements: Element[] = [];

      //   if (exhibit == syncMaster) {
      //     elements.push({
      //       hostname: exhibit.hostname,
      //       role: '',
      //       viewportTransform: canvas.width + 'x' + canvas.height + '+0+0'
      //     });
      //   } else {
      //     elements.push({
      //       hostname: syncMaster.hostname,
      //       role: '',
      //       viewportTransform: '1x1+0+0'
      //     });
      //     elements.push({
      //       hostname: exhibit.hostname,
      //       role: '',
      //       viewportTransform: canvas.width + 'x' + canvas.height + '+0+0'
      //     })
      //   }

      //   overlay.sync = Convert.syncToJson({
      //     canvasDimensions: canvas,
      //     elements: elements
      //   })
      // }

      // this.expositionClient.setPackageOverlay(this.expositionId, exhibit_id, overlay).subscribe(_ => { /* IGNORE */});
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

  packageNameForOverlay(ov: PackageOverlayProperties) {
    return (this.selectedPackages.find(p => p.id == ov.packageId))?.name ?? '';
  }

  selectSensors() {
    let enabledOutputs = this.graph.getEnabledOutputs(this.selectedExhibits[0].hostname);
    let selectDialog = this.dialog.open(SensorSelectionDialogComponent, { data: { exhibits: this.selectedExhibits, enabledOutputs } });
    selectDialog.componentInstance.onSensorsSaved.subscribe(sensors => {
      this.graph.setEnabledOutputs(this.selectedExhibits, sensors);
      selectDialog.close();
    });
  }

  selectPackage() {
    let selectDialog = this.dialog.open(PackageSelectionDialogComponent);
    selectDialog.componentInstance.onPackageSelected.subscribe(pkg => {
      this.selectedPackages.push(pkg);
      selectDialog.close();

      if (this.selectedExhibits) {
        let newOverlays = this.selectedExhibits.map(
          ex => this.expositionClient.addPackageOverlay(this.expositionId, {
            exhibitId: ex.hostname,
            packageId: pkg.id
          } as NewOverlayProperties)
        );
        forkJoin(newOverlays).subscribe(
          overlays => {
            overlays.map(ov => {
              this.graph.addPackageOverlay(ov.exhibitHostname, pkg, ov);
            })
          }
        );
      }
    });
  }

  selectExhibit(exhibits: ExhibitProperties[]) {
    this.selectedExhibits = exhibits;

    if (this.selectedExhibits) {
      this.selectedPackages = this.graph.getPackages(exhibits[0].hostname);
      this.selectedOverlays = this.graph.getOverlays(exhibits[0].hostname);

      this.deviceTabGroup.selectedIndex = 0;
      this.startupPackageId = this.selectedOverlays.find((ov) => { return ov.isStartupPackage })?.packageId;
    } else {
      this.selectedOverlays = null;
      this.selectedPackages = null;
    }
  }

  selectStartupPackage(event) {
    let overlay = this.selectedOverlays.find((ov) => { return ov.isStartupPackage });
    if (overlay) {
      overlay.isStartupPackage = false;
    }
    overlay = this.selectedOverlays.find((ov) => { return ov.packageId == event.value });
    if (overlay) {
      overlay.isStartupPackage = true;
    }
  }

  addCustomInput(input: CustomInput) {
    this.graph.addCustomInput(this.selectedExhibits[0].hostname, input);
  }

  addCustomOutput(output: CustomOutput) {
    this.graph.addCustomOutput(this.selectedExhibits[0].hostname, output);
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
    var changedOverlay = this.selectedOverlays[this.packageTabGroup.selectedIndex];
    changedOverlay.overwriteInputs = overlay.overwriteInputs;
    changedOverlay.overwriteSettings = overlay.overwriteSettings;
  }
}
