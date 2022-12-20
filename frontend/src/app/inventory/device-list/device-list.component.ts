import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ExhibitClient, ExhibitProperties, SensorProperties } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.css']
})
export class DeviceListComponent implements OnInit, AfterViewInit {
  @Input() showPending = true;
  @Input() showDisconnected = true;
  @Input() showActions = true;
  @Input() searchTerm = '';
  @Input() checkBoxes = false;

  @Output() onDeviceSelected = new EventEmitter<string>();
  @Output() onDeviceChecked = new EventEmitter<CheckedEvent>();

  devicesDataSource = new MatTableDataSource<DeviceEntry>();
  displayedColumns = [];
  
  constructor(
    private deviceClient: ExhibitClient
  ) { }

  ngAfterViewInit(): void {
    this.devicesDataSource.filterPredicate = this.doFilter;
  }

  ngOnInit(): void {
    this.deviceClient.getAllExhibits().subscribe(data => {
      let devices = data.map((exh, _) => {
        return {
          state: DeviceState.DISCONNECTED,
          hostname: exh.hostname,
          tags: exh.tags,
          sensors: exh.sensors
        } as DeviceEntry;
      });
      
      this.deviceClient.getEstablishedConnections().subscribe(conns => {
        conns.map((conn, _) => {
          let dev = devices.find(d => d.hostname == conn);
          if (dev) {
            dev.state = DeviceState.CONNECTED;
          }
        });
      });

      this.deviceClient.getPendingConnections().subscribe(conns => {
        conns.map((conn, _) => {
          let dev = {
            state: DeviceState.PENDING,
            hostname: conn
          } as DeviceEntry;
          devices.push(dev);
          this.devicesDataSource.data = devices;
        });
      });

      this.devicesDataSource.data = devices;
    });
    if (!this.showActions) {
      this.displayedColumns = ['status', 'hostname', 'tags'];
    } else {
      this.displayedColumns = ['status', 'hostname', 'tags', 'actions'];
    }
    if (this.checkBoxes) {
      this.displayedColumns.push('checkbox');
    }
  }

  doFilter(data: DeviceEntry, filter: string) {
    if (data.state === DeviceState.DISCONNECTED && !this.showDisconnected) {
      return false;
    }
    if (data.state === DeviceState.PENDING && !this.showPending) {
      return false;
    }

    // TODO: use searchTerm
    return true;
  }

  acceptPending(device: DeviceEntry) {
    this.deviceClient.acceptConnection(device.hostname).subscribe(_ => { /* IGNORE */ });
  }

  forgetDevice(device: DeviceEntry) {
    this.deviceClient.forgetConnection(device.hostname).subscribe(_ => { /* IGNORE */ });
  }

  openDetails(device: DeviceEntry) {
    if (!this.checkBoxes)
      this.onDeviceSelected.emit(device.hostname);
  }

  deviceChecked(checked, device: DeviceEntry) {
    this.onDeviceChecked.emit({
      hostname: device.hostname,
      checked: checked
    });
  }
}


export enum DeviceState {
  PENDING = 0,
  CONNECTED = 1,
  DISCONNECTED = 2,
  WARNING = 3
}
export class DeviceEntry {
  state: DeviceState;
  hostname: string;
  tags: string[];
  sensors: SensorProperties[];
}
export class CheckedEvent {
  hostname: string;
  checked: boolean;
}