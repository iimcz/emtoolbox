
import { Component, Input, OnInit, Type } from '@angular/core';
import { Control } from 'rete';
import { AngularControl } from 'rete-angular-render-plugin';
import { ExhibitProperties, PackageProperties } from 'src/app/services/api.generated.service';

@Component({
    templateUrl: './package-detail.control.html',
    styleUrls: ['./package-detail.control.css'],
})
export class PackageDetailComponent implements OnInit {
    @Input() packages: PackageProperties[];
  
    ngOnInit() {
    }
}

export class PackageDetailControl extends Control implements AngularControl {
    component: Type<PackageDetailComponent>
    props: { [key: string]: unknown }

    constructor(public key, pkgs) {
        super(key);

        this.component = PackageDetailComponent;
        this.props = {
            packages: pkgs
        };
    }

    setPackages(val: PackageProperties[]) {
        this.props.packages = val;
    }
}