
import { Component, Input, OnInit, Type } from '@angular/core';
import { Control } from 'rete';
import { AngularControl } from 'rete-angular-render-plugin';
import { ExhibitProperties, PackageProperties } from 'src/app/services/api.generated.service';

@Component({
    templateUrl: './device-detail.control.html',
    styleUrls: ['./device-detail.control.css'],
})
export class DeviceDetailComponent implements OnInit {
    @Input() exhibit!: ExhibitProperties;
  
    ngOnInit() {
    }
}

export class DeviceDetailControl extends Control implements AngularControl {
    component: Type<DeviceDetailComponent>
    props: { [key: string]: unknown }

    constructor(public key, exhibit) {
        super(key);

        this.component = DeviceDetailComponent;
        this.props = {
            exhibit: exhibit
        };
    }

    setExhibit(val: ExhibitProperties) {
        this.props.exhibit = val;
    }
}