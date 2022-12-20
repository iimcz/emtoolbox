import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Settings } from 'src/app/model/package';
import { PackageOverlayProperties, ValueType } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-overlay-detail',
  templateUrl: './overlay-detail.component.html',
  styleUrls: ['./overlay-detail.component.css']
})
export class OverlayDetailComponent {
  @Input() overlay: PackageOverlayProperties;
  @Output() onAddCustomInput = new EventEmitter<CustomInput>();
  @Output() onAddCustomOutput = new EventEmitter<CustomOutput>();
  @Output() onOverlayChanged = new EventEmitter<PackageOverlayProperties>();
  @Output() onSettingsChanged = new EventEmitter<Settings>();

  eventTypes = ['Bez hodnoty', 'Bool', 'Číslo', 'Událost', 'Komplexní'];

  overwriteSettings = this.fb.control(false);
  overwriteInputs = this.fb.control(false);

  customInputFG: FormGroup = this.fb.group({
    customEffect: '',
    customValueType: ValueType.Void
  });
  customOutputFG: FormGroup = this.fb.group({
    customPath: '',
    customValueType: ValueType.Void
  })

  settingsFG: FormGroup = this.fb.group({
    // TODO
  });

  constructor(
    private fb: FormBuilder
  ) { }

  addCustomInput() {
    this.onAddCustomInput.emit({
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
  effect: string;
  type: ValueType;
}

export class CustomOutput
{
  path: string;
  type: ValueType;
}