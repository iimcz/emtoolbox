import { Component, Input, Node, Output } from 'rete';
import { AngularComponent, AngularComponentData } from 'rete-angular-render-plugin';
import { NodeData, WorkerInputs, WorkerOutputs } from 'rete/types/core/data';
import { DataType } from 'src/app/services/api.generated.service';
import { ConstantControl } from '../../controls/transformations/constant.control';
import { MyNodeComponent } from '../../node/node.component';
import { boolSocket, floatSocket, integerSocket, stringSocket, voidSocket, } from '../../rete-sockets';
import { Transform } from '../../../../model/package';


class VoidBaseConstantComponent extends Component implements AngularComponent {
    data: AngularComponentData;
    category: string[];

    constructor(name: string = '') {
        super(name);
        this.data.render = 'angular';
        this.data.component = MyNodeComponent;
        this.category = ['Void'];
    }

    async builder(node: Node) {
        node.addInput(new Input('in', 'Vstup', voidSocket));

        node.data.transformation = ({
            from: 'void',
            type: 'constant',
            value: node.data.constant ?? ''
        } as Transform);
    }

    worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs, ...args: unknown[]) {
        throw new Error('Method not implemented.');
    }

    updateTransformation(node: Node, value: any) {
        (node.data.transformation as Transform).value = value;
    }
}

export class VoidStringConstantComponent extends VoidBaseConstantComponent {
    constructor() {
        super('Void -> String');
        this.category.push('String');
    }

    async builder(node: Node) {
        super.builder(node);
        node.addOutput(new Output('out', 'Výstup', stringSocket));
        node.addControl(new ConstantControl('constant', DataType.String, (val) => this.updateTransformation(node, val)));
    }
}

export class VoidBoolConstantComponent extends VoidBaseConstantComponent {
    constructor() {
        super('Void -> Bool');
        this.category.push('Bool');
    }

    async builder(node: Node) {
        super.builder(node);
        node.addOutput(new Output('out', 'Výstup', boolSocket));
        node.addControl(new ConstantControl('constant', DataType.Bool, (val) => this.updateTransformation(node, val)));
    }
}

export class VoidIntegerConstantComponent extends VoidBaseConstantComponent {
    constructor() {
        super('Void -> Integer');
        this.category.push('Integer');
    }

    async builder(node: Node) {
        super.builder(node);
        node.addOutput(new Output('out', 'Výstup', integerSocket));
        node.addControl(new ConstantControl('constant', DataType.Integer, (val) => this.updateTransformation(node, val)));
    }
}

export class VoidFloatConstantComponent extends VoidBaseConstantComponent {
    constructor() {
        super('Void -> Float');
        this.category.push('Float');
    }

    async builder(node: Node) {
        super.builder(node);
        node.addOutput(new Output('out', 'Výstup', floatSocket));
        node.addControl(new ConstantControl('constant', DataType.Float, (val) => this.updateTransformation(node, val)));
    }
}