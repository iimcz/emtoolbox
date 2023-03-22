import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { ExpositionDetailComponent } from '../exposition/exposition-detail/exposition-detail.component';
import { PackageGraphComponent } from '../exposition/package-graph/package-graph.component';
import { CheckedEvent } from '../inventory/device-list/device-list.component';
import { SensorSelectionDialogComponent } from '../inventory/dialogs/sensor-selection-dialog/sensor-selection-dialog.component';
import { Convert, Settings, Sync } from '../model/package';
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
  @ViewChild('savingTemplate') savingTemplate: TemplateRef<any>;
  expositionId: number;
  expositionName: string;

  selectedPackages: PackageProperties[];
  selectedOverlays: PackageOverlayProperties[];
  selectedExhibits: ExhibitProperties[];
  additionalOverlays: Map<Number, PackageOverlayProperties[]>;
  
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
    let saveDialog = this.dialog.open(this.savingTemplate, { disableClose: true });

    this.detail.saveDetails();
    this.graph.saveGraph();

    let exhibits = this.graph.getIncludedExhibits();
    let syncMaster: ExhibitProperties = null;
    let updates = [];
    let usedOverlays: number[] = [];

    for (let exhibit_id of exhibits) {
      let exhibit = this.graph.getExhibit(exhibit_id);
      let overlays = this.graph.getOverlays(exhibit_id);

      if (!syncMaster) {
        syncMaster = exhibit;
      }

      for (const overlay of overlays) {
        overlay.inputs = this.graph.getOverlayInputs(exhibit.hostname, overlay.packageId.toString());

        let sync = {} as Sync;
        if (overlay.sync) {
          sync = Convert.toSync(overlay.sync);
        }
        sync.relayAddress = syncMaster.hostname;
        overlay.sync = Convert.syncToJson(sync);

        updates.push(this.expositionClient.setPackageOverlay(this.expositionId, overlay.id, overlay));
        usedOverlays.push(overlay.id);
      }
    }
    // Clean old overlays
    updates.push(this.expositionClient.deleteExceptSpecified(this.expositionId, usedOverlays));

    if (updates.length > 0) {
      forkJoin(updates).subscribe(_ => {
        saveDialog.close();
      });
    } else {
      saveDialog.close();
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

      this.selectedOverlays = [];
      this.additionalOverlays = new Map<Number, PackageOverlayProperties[]>();
      
      // Handle multidevices with more than one overlay per package (subdevices have their own overlays)
      for (const overlay of this.graph.getOverlays(exhibits[0].hostname)) {
        if (this.selectedOverlays.find(ov => ov.packageId == overlay.packageId)) {
          this.additionalOverlays.get(overlay.packageId).push(overlay);
        } else {
          this.selectedOverlays.push(overlay);
          this.additionalOverlays.set(overlay.packageId, []);
        }
      }

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

    for (let addOverlay of this.additionalOverlays.get(changedOverlay.packageId)) {
      addOverlay.overwriteInputs = overlay.overwriteInputs;
      addOverlay.overwriteSettings = overlay.overwriteSettings;
    }
  }
}
