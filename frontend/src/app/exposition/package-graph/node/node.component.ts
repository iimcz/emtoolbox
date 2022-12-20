import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { NodeComponent, NodeService } from 'rete-angular-render-plugin';

@Component({
    templateUrl: './node.component.html',
    styleUrls: ['./node.component.sass'],
    providers: [NodeService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class MyNodeComponent extends NodeComponent {
    constructor(protected service: NodeService, protected cdr: ChangeDetectorRef) {
        super(service, cdr);
    }
}