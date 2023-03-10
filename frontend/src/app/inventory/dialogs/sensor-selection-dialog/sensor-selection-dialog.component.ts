import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataType, ExhibitProperties, SensorProperties } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-sensor-selection-dialog',
  templateUrl: './sensor-selection-dialog.component.html',
  styleUrls: ['./sensor-selection-dialog.component.css']
})
export class SensorSelectionDialogComponent {
  @Input() exhibits: ExhibitProperties[];
  @Input() enabledSensors: string[];
  @Output() onSensorsSaved = new EventEmitter<string[]>();

  public dataTypes: string[];
  public typeSensors: SensorProperties[][][] = [];

  constructor(@Inject(MAT_DIALOG_DATA) private data) {
    if (data) {
      this.exhibits = (data.exhibits as ExhibitProperties[]);
      this.enabledSensors = (data.enabledOutputs as string[]);
    }

    let values = Object.values(DataType);
    this.dataTypes = values.splice(0, values.length / 2) as string[];

    // TODO: rethink this, maybe there's a better way
    this.exhibits.forEach((exhibit, i) => {
      this.typeSensors.push([]);
      this.dataTypes.forEach((__, _) => {
        this.typeSensors[i].push([]);
      })
      exhibit.sensors.forEach((sensor, _) => {
        this.typeSensors[i][sensor.valueType as number].push(sensor);
      });
    });
  }

  changeSensor(event, sensor) {
    if (event.checked) {
      if (!this.enabledSensors.includes(sensor.path)) {
        this.enabledSensors.push(sensor.path);
      }
    }
    else {
      const others = this.enabledSensors.filter((s, _) => s != sensor.path);
      this.enabledSensors = others;
    }
  }

  sensorsSaved() {
    this.onSensorsSaved.emit(this.enabledSensors);
  }
}