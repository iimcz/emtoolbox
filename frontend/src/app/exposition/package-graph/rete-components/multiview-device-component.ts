import { Node } from "rete";
import { ExhibitProperties } from "src/app/services/api.generated.service";
import { DeviceDetailControl } from "../controls/device-detail.control";
import { PackageDetailControl } from "../controls/package-detail.control";
import { ViewDeviceComponent } from "./view-device-component";

export class MultiViewDeviceComponent extends ViewDeviceComponent {
    constructor() {
        super('Multizařízení')
    }

    async builder(node: Node) {
        const exhibits: ExhibitProperties[] = node.data.exhibits as ExhibitProperties[];
        if (!exhibits)
            return;
        if (!node.data.additionalInputs) {
            node.data.additionalInputs = [];
        }
        if (!node.data.additionalOutputs) {
            node.data.additionalOutputs = [];
        }
        if (!node.data.enabledOutputs) {
            node.data.enabledOutputs = [];
        }
        if (!node.data.packages) {
            node.data.packages = [];
        }
        if (!node.data.overlays) {
            node.data.overlays = [];
        }

        let index = 0;
        for (let ex of exhibits) {
            node.addControl(new DeviceDetailControl('info-' + (index++), ex));
        }
        node.addControl(new PackageDetailControl('pkg', node.data.package));

        for (let ex of exhibits) {
            await this.addSensorConnectivity(node, ex);
        }
        await this.addCustomConnectivity(node);
    }
}