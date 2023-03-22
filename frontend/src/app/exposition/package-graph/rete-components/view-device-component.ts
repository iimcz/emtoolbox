import { Component, Input, Node, Output } from 'rete';
import { AngularComponent, AngularComponentData } from 'rete-angular-render-plugin';
import { NodeData, WorkerInputs, WorkerOutputs } from 'rete/types/core/data';
import { CustomInput, CustomOutput } from 'src/app/overlays/overlay-detail/overlay-detail.component';
import { ExhibitProperties, DataType, PackageProperties, PackageOverlayProperties } from 'src/app/services/api.generated.service';
import { DeviceDetailControl } from '../controls/device-detail.control';
import { PackageDetailControl } from '../controls/package-detail.control';
import { MyNodeComponent } from '../node/node.component';
import { boolSocket, floatSocket, integerSocket, stringSocket, vector2Socket, vector3Socket, voidSocket,} from '../rete-sockets';


export class ViewDeviceComponent extends Component implements AngularComponent {
    data: AngularComponentData;

    constructor(name: string = 'Zařízení') {
        super(name);
        this.data.render = 'angular';
        this.data.component = MyNodeComponent;
    }

    async builder(node: Node) {
        const exhibit: ExhibitProperties = node.data.exhibit as ExhibitProperties;
        if (!exhibit)
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

        node.addControl(new DeviceDetailControl('info', exhibit));
        node.addControl(new PackageDetailControl('pkg', node.data.packages));

        await this.addSensorConnectivity(node, exhibit);
        await this.addCustomConnectivity(node);
    }

    async addSensorConnectivity(node: Node, exhibit: ExhibitProperties, enabledOutputs: string[] = (node.data.enabledOutputs as string[])) {
        for (let sensor of exhibit.sensors) {
            let name = sensor.friendlyName ?? sensor.path;
            let path = '/' + exhibit.hostname + '/' + sensor.path;

            if (enabledOutputs.includes(sensor.path))

                switch (sensor.valueType) {
                    case DataType.Void:
                        node.addOutput(new Output(path, name, voidSocket));
                        break;
                    case DataType.Bool:
                        node.addOutput(new Output(path, name, boolSocket));
                        break;
                    case DataType.Integer:
                        node.addOutput(new Output(path, name, integerSocket));
                        break;
                    case DataType.Float:
                        node.addOutput(new Output(path, name, floatSocket));
                        break;
                    case DataType.String:
                        node.addOutput(new Output(path, name, stringSocket));
                        break;
                
                    case DataType.Vector2:
                        node.addOutput(new Output(path, name, vector2Socket));
                    case DataType.Vector3:
                        node.addOutput(new Output(path, name, vector3Socket));
                }
        }
    }

    async addCustomConnectivity(node: Node) {
        if (node.data.additionalInputs) {
            let inputs = node.data.additionalInputs as CustomInput[];
            for (let input of inputs) {
                const path = input.packageId + '/' + input.effect;
                const socket = this.getSocketType(input.type);
                node.addInput(new Input(path, path, socket));
            }
        }

        if (node.data.additionalOutputs) {
            let outputs = node.data.additionalOutputs as CustomOutput[];
            for (let output of outputs) {
                const socket = this.getSocketType(output.type);
                node.addOutput(new Output(output.path, output.path, socket));
            }
        }
    }

    worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs, ...args: unknown[]) {
        throw new Error('Method not implemented.');
    }

    addPackage(node: Node, exhibit: string, pkg: PackageProperties, ov: PackageOverlayProperties) {
        let pkgs = (node.data.packages as PackageProperties[]);
        let ovs = (node.data.overlays as PackageOverlayProperties[]);

        if (!pkgs.includes(pkg)) pkgs.push(pkg);
        if (!ovs.includes(ov)) ovs.push(ov);
    }

    addCustomInput(node: Node, input: CustomInput) {
        let inputs = (node.data.additionalInputs as CustomInput[]);
        if (inputs.find(v => v.effect == input.effect && v.packageId == input.packageId)) return;
        inputs.push(input);
        const path = input.packageId + '/' + input.effect;

        let socket = this.getSocketType(input.type);
        node.addInput(new Input(path, path, socket));
        node.update();
    }

    addCustomOutput(node: Node, output: CustomOutput) {
        let outputs = (node.data.additionalOutputs as CustomOutput[]);
        if (outputs.find(v => v.path == output.path)) return;
        outputs.push(output);

        let socket = this.getSocketType(output.type);
        node.addOutput(new Output(output.path, output.path, socket));
        node.update();
    }

    setEnabledOutputs(node: Node, exhibits: ExhibitProperties[], outputPaths: string[]) {
        node.data.enabledOutputs = outputPaths;
        
        let validOutputs = outputPaths;
        const customOutputs = node.data.additionalOutputs as CustomOutput[];
        validOutputs.push(...customOutputs.map((output, _) => output.path));
        let outputSet = new Set<string>(validOutputs);

        let toDelete = [];
        node.outputs.forEach(output => {
            const key = this.stripHostname(output.key);
            if (!outputSet.has(key)) {
                toDelete.push(output);
            } else {
                outputSet.delete(key);
            }
        });
        for (const output of toDelete) {
            node.getConnections().forEach(conn => {
                if (conn.output == output) {
                    conn.remove();
                }
            });
            node.removeOutput(output);
        }
        let rest = Array.from<string>(outputSet.values());
        for (const exhibit of exhibits) {
            this.addSensorConnectivity(node, exhibit, rest);
        }
        node.update();
    }

    stripHostname(path: string) {
        const pos = path.indexOf('/', 1);
        return path.substring(pos + 1);
    }

    getSocketType(type: DataType) {
        switch (type) {
            case DataType.Void:
                return voidSocket;
            case DataType.Bool:
                return boolSocket;
            case DataType.Integer:
                return integerSocket;
            case DataType.Float:
                return floatSocket;
            case DataType.String:
                return stringSocket;
            
            case DataType.Vector2:
                return vector2Socket;
            case DataType.Vector3:
                return vector3Socket;
        }
    }

    getEnabledOutputs(node: Node): string[] {
        return node.data.enabledOutputs as string[];
    }

    getPackageReteInputs(node: Node, package_id: string): [string, Input][] {
        let inputs = [];
        for (const input of node.inputs) {
            if (input[0].startsWith(package_id + '/')) {
                inputs.push(input);
            }
        }
        return inputs;
    }

    packages(node: Node): PackageProperties[] {
        return (node.data.packages as PackageProperties[]);
    }

    overlays(node: Node): PackageOverlayProperties[] {
        return (node.data.overlays as PackageOverlayProperties[]);
    }
}
export interface PackageExhibitPair {
    packageId: number,
    exhibitHostname: string
}