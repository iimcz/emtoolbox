import { Node } from "rete";
import { ExhibitProperties } from "src/app/services/api.generated.service";
import { DeviceDetailControl } from "../controls/device-detail.control";
import { ViewDeviceComponent } from "./view-device-component";

export class MultiViewDeviceComponent extends ViewDeviceComponent {
    constructor() {
        super('Multizařízení')
    }

    async builder(node: Node) {
        const exhibits: ExhibitProperties[] = node.data.exhibits as ExhibitProperties[];
        if (!exhibits)
            return;

        node.addControl(new DeviceDetailControl('info', exhibits.reduce((s, ex, i, a) => { return s + '\n' + ex.hostname; }, ''), node.data.package));

        for (let ex of exhibits) {
            await this.addConnectibility(node, ex, true);
        }
        await this.addAdditionalConnectivity(node);
    }
}