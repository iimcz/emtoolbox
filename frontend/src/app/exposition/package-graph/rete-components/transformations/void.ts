import { Component, Input, Node, Output } from 'rete';
import { AngularComponent, AngularComponentData } from 'rete-angular-render-plugin';
import { NodeData, WorkerInputs, WorkerOutputs } from 'rete/types/core/data';
import { MyNodeComponent } from '../../node/node.component';
import { boolSocket, floatSocket, integerSocket, stringSocket, voidSocket,} from '../../rete-sockets';


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
    }

    worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs, ...args: unknown[]) {
        throw new Error('Method not implemented.');
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
    }
}