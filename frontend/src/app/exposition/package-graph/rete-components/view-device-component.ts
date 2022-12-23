import { Component, Input, Node, Output } from 'rete';
import { AngularComponent, AngularComponentData } from 'rete-angular-render-plugin';
import { NodeData, WorkerInputs, WorkerOutputs } from 'rete/types/core/data';
import { CustomInput, CustomOutput } from 'src/app/overlays/overlay-detail/overlay-detail.component';
import { ExhibitProperties, ValueType } from 'src/app/services/api.generated.service';
import { DeviceDetailControl } from '../controls/device-detail.control';
import { PackageDetailControl } from '../controls/package-detail.control';
import { MyNodeComponent } from '../node/node.component';
import { boolSocket, complexSocket, eventSocket, numberSocket, voidSocket } from '../rete-sockets';


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

        node.addControl(new DeviceDetailControl('info', exhibit));
        node.addControl(new PackageDetailControl('pkg', node.data.package));

        await this.addConnectibility(node, exhibit);
        await this.addAdditionalConnectivity(node);
    }

    async addConnectibility(node: Node, exhibit: ExhibitProperties, exhibitPathPrefix: boolean = false) {
        for (let sensor of exhibit.sensors) {
            let name = sensor.friendlyName ?? sensor.path;
            let path = exhibitPathPrefix ? '/' + exhibit.hostname + '/' + sensor.path : sensor.path;
            switch (sensor.valueType) {
                case ValueType.Void:
                    node.addOutput(new Output(path, name, voidSocket));
                    break;
                case ValueType.Bool:
                    node.addOutput(new Output(path, name, boolSocket));
                    break;
                case ValueType.Event:
                    for (let event of sensor.availableEvents.split(',')) {
                        node.addOutput(new Output(path + ':' + event, name + ':' + event, eventSocket));
                    }
                    break;
                case ValueType.Number:
                    node.addOutput(new Output(path, name, numberSocket));
                    break;
                case ValueType.Complex:
                    node.addOutput(new Output(path, name, complexSocket));
                    break;
            }
        }
    }

    async addAdditionalConnectivity(node: Node) {
        if (node.data.additionalInputs) {
            let inputs = node.data.additionalInputs as CustomInput[];
            for (let input of inputs) {
                switch (input.type) {
                    case ValueType.Void:
                        node.addInput(new Input(input.effect, input.effect, voidSocket));
                        break;
                    case ValueType.Bool:
                        node.addInput(new Input(input.effect, input.effect, boolSocket));
                        break;
                    case ValueType.Number:
                        node.addInput(new Input(input.effect, input.effect, numberSocket));
                        break;
                    case ValueType.Event:
                        node.addInput(new Input(input.effect, input.effect, eventSocket));
                        break;
                    case ValueType.Complex:
                        node.addInput(new Input(input.effect, input.effect, complexSocket));
                        break;
                }
            }
        }

        if (node.data.additionalOutputs) {
            let outputs = node.data.additionalOutputs as CustomOutput[];
            for (let output of outputs) {
                switch (output.type) {
                    case ValueType.Void:
                        node.addOutput(new Output(output.path, output.path, voidSocket));
                        break;
                    case ValueType.Bool:
                        node.addOutput(new Output(output.path, output.path, boolSocket));
                        break;
                    case ValueType.Number:
                        node.addOutput(new Output(output.path, output.path, numberSocket));
                        break;
                    case ValueType.Event:
                        node.addOutput(new Output(output.path, output.path, eventSocket));
                        break;
                    case ValueType.Complex:
                        node.addOutput(new Output(output.path, output.path, complexSocket));
                        break;
                }
            }
        }
    }

    worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs, ...args: unknown[]) {
        throw new Error('Method not implemented.');
    }
}