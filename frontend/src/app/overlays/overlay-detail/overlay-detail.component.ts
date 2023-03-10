import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Settings } from 'src/app/model/package';
import { PackageOverlayProperties, DataType } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-overlay-detail',
  templateUrl: './overlay-detail.component.html',
  styleUrls: ['./overlay-detail.component.css']
})
export class OverlayDetailComponent implements OnInit {
  @Input() overlay: PackageOverlayProperties;
  @Output() onAddCustomInput = new EventEmitter<CustomInput>();
  @Output() onAddCustomOutput = new EventEmitter<CustomOutput>();
  @Output() onOverlayChanged = new EventEmitter<PackageOverlayProperties>();
  @Output() onSettingsChanged = new EventEmitter<Settings>();

  eventTypes = [];

  overwriteSettings = this.fb.control(false);
  overwriteInputs = this.fb.control(false);

  customInputFG: FormGroup = this.fb.group({
    customEffect: '',
    customValueType: DataType.Void
  });
  customOutputFG: FormGroup = this.fb.group({
    customPath: '',
    customValueType: DataType.Void
  })

  settingsFG: FormGroup = this.fb.group({
    // TODO
  });

  constructor(
    private fb: FormBuilder
  ) {
    let values = Object.values(DataType);
    this.eventTypes = values.splice(0, values.length / 2) as string[];
  }

  ngOnInit(): void {
    this.overwriteInputs.setValue(this.overlay.overwriteInputs);
    this.overwriteSettings.setValue(this.overlay.overwriteSettings);
  }

  addCustomInput() {
    this.onAddCustomInput.emit({
      packageId: this.overlay.packageId,
      effect: this.customInputFG.get('customEffect').value,
      type: this.customInputFG.get('customValueType').value,
    });
  }

  addCustomOutput() {
    this.onAddCustomOutput.emit({
      path: this.customOutputFG.get('customPath').value,
      type: this.customOutputFG.get('customValueType').value,
    })
  }

  overlayChanged() {
    this.onOverlayChanged.emit({
      overwriteInputs: this.overwriteInputs.value,
      overwriteSettings: this.overwriteSettings.value
    } as PackageOverlayProperties);
  }
}

export class CustomInput
{
  packageId: number;
  effect: string;
  type: DataType;
}

export class CustomOutput
{
  path: string;
  type: DataType;
}