import { NodeEditor, Input as ReteInput, Output as ReteOutput } from 'rete';
import ConnectionPlugin from 'rete-connection-plugin';
import { AngularRenderPlugin } from 'rete-angular-render-plugin';
import ContextMenuPlugin from 'rete-context-menu-plugin';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ViewDeviceComponent } from './rete-components/view-device-component';

import { DataType, ExhibitClient, ExhibitProperties, ExpositionClient, ExpositionProperties, PackageOverlayProperties, PackageProperties } from 'src/app/services/api.generated.service';
import { DeviceDetailControl } from './controls/device-detail.control';
import { CustomInput, CustomOutput } from 'src/app/overlays/overlay-detail/overlay-detail.component';
import { boolSocket, voidSocket } from './rete-sockets';
import { Action, CanvasDimensions, Convert, Mapping, Type } from 'src/app/model/package';
import { MultiViewDeviceComponent } from './rete-components/multiview-device-component';
import { Observable, of, scheduled } from 'rxjs';
import { map, mergeMap, zipAll } from 'rxjs/operators';
import { PackageDetailControl } from './controls/package-detail.control';
import { Sync, Element } from 'src/app/model/package';
import { VoidBoolConstantComponent, VoidFloatConstantComponent, VoidIntegerConstantComponent, VoidStringConstantComponent } from './rete-components/transformations/void';

@Component({
  selector: 'app-package-graph',
  templateUrl: './package-graph.component.html',
  styleUrls: ['./package-graph.component.css']
})
export class PackageGraphComponent implements AfterViewInit {
  @Input() expositionId: number;
  @Output() onDeviceSelected = new EventEmitter<ExhibitProperties[]>();
  @Output() onDeviceDeleted = new EventEmitter<DeviceRemovedArgs>();

  @ViewChild('nodeEditor') el: ElementRef;
  editor: NodeEditor = null;

  singleDeviceComponent = new ViewDeviceComponent();
  multiDeviceComponent = new MultiViewDeviceComponent();

  transformComponents = [
    new VoidStringConstantComponent(),
    new VoidBoolConstantComponent(),
    new VoidIntegerConstantComponent(),
    new VoidFloatConstantComponent()
  ];

  constructor(
    private expositionClient: ExpositionClient,
    private deviceClient: ExhibitClient,
  ) { }

  async ngAfterViewInit() {
    this.editor = new NodeEditor('package-graph@0.0.1', this.el.nativeElement);
    this.editor.use(ConnectionPlugin);
    console.log('AngularRenderPlugin', AngularRenderPlugin);
    this.editor.use(AngularRenderPlugin);
    this.editor.use(ContextMenuPlugin, {
      allocate(component) {
        // TODO: better check?
        if (typeof(component) != typeof(ViewDeviceComponent) && typeof(component) != typeof(MultiViewDeviceComponent))
          return component.category;
      },
      rename(component) {
        return component.name;
      },
      nodeItems: {
        'Delete': true,
        'Clone': false
      }
    });

    this.editor.register(this.singleDeviceComponent);
    this.editor.register(this.multiDeviceComponent);
    this.transformComponents.map(c => this.editor.register(c));
    this.editor.view.resize();

    this.loadGraph();

    this.editor.on(['nodedragged', 'connectioncreated', 'connectionremoved', 'keyup', 'resetconnection'], (args: any) => {
      this.saveGraph();
    });

    this.editor.on(['nodeselected'], (node) => {
      let dev = node.data.exhibit as ExhibitProperties;
      let devs = node.data.exhibits as ExhibitProperties[];

      if (dev != null)
        this.onDeviceSelected.emit([dev]);
      else if (devs != null)
        this.onDeviceSelected.emit(devs);
      else
        this.onDeviceSelected.emit(null);
    });

    this.editor.on(['noderemoved'], (node) => {
      let devices = node.data.exhibits as ExhibitProperties[] ?? [ node.data.exhibit ] as ExhibitProperties[];
      if (!devices) {
        return;
      }
      let overlays = node.data.overlays as PackageOverlayProperties[];
      this.onDeviceDeleted.emit({ devices, overlays });
    })
  }

  findNodeByExhibit(id: string) {
    let node = this.editor.nodes.find((value, index, obj) => {
      if (value.data.exhibit) {
        let dev = value.data.exhibit as ExhibitProperties;
        return dev.hostname === id;
      }
      if (value.data.exhibits) {
        let dev = (value.data.exhibits as ExhibitProperties[]).find(ex => ex.hostname === id);
        if (dev)
          return true;
      }
    });
    return node;
  }

  addSingleDevice(id: string) {
    let node = this.findNodeByExhibit(id);
    if (node) {
      this.editor.selectNode(node);
    } else {
      this.deviceClient.getExhibit(id).subscribe(exhibit => {
        this.singleDeviceComponent.createNode({ exhibit: exhibit }).then(n => {
          this.editor.addNode(n);
          this.editor.selectNode(n);
        });
      });
    }
  }

  addMultiDevice(ids: string[]) {
    let node = this.findNodeByExhibit(ids[0]);
    if (node) {
      this.editor.selectNode(node);
    } else {
      of(...ids).pipe(
        map(id => this.deviceClient.getExhibit(id)),
        zipAll()
      ).subscribe(data => {
        this.multiDeviceComponent.createNode({ exhibits: data }).then(n => {
          this.editor.addNode(n);
          this.editor.selectNode(n);
        });
      });
    }
  }

  getExhibit(exhibit: string) {
    let node = this.findNodeByExhibit(exhibit);
    if (node) {
      // TODO: handle better to avoid redundant find
      if (node.data.exhibit)
        return node.data.exhibit as ExhibitProperties;
      else
        return (node.data.exhibits as ExhibitProperties[]).find(ex => ex.hostname === exhibit);
    }
  }

  addPackageOverlay(exhibit: string, pkg: PackageProperties, ov: PackageOverlayProperties) {
    let node = this.findNodeByExhibit(exhibit);

    if (node) {
      this.singleDeviceComponent.addPackage(node, exhibit, pkg, ov);
    }
  }

  getPackages(exhibit: string): PackageProperties[] {
    let node = this.findNodeByExhibit(exhibit);
    if (node) {
      return this.singleDeviceComponent.packages(node);
    }
  }

  getOverlays(exhibit: string): PackageOverlayProperties[] {
    let node = this.findNodeByExhibit(exhibit);
    if (node) {
      return this.singleDeviceComponent.overlays(node);
    }
  }

  getEnabledOutputs(exhibit: string): string[] {
    let node = this.findNodeByExhibit(exhibit);
    if (node) {
      return this.singleDeviceComponent.getEnabledOutputs(node);
    }
  }

  setEnabledOutputs(exhibits: ExhibitProperties[], outputs: string[]) {
    let node = this.findNodeByExhibit(exhibits[0].hostname);
    if (node) {
      this.singleDeviceComponent.setEnabledOutputs(node, exhibits, outputs);
    }
  }

  getOverlayInputs(exhibit: string): string {
    let node = this.findNodeByExhibit(exhibit);
    let inputs: Action[] = [];
    if (node) {
      for (let input of node.inputs) {
        for (let conn of input[1].connections) {
          let output = conn.output;
          let otherNode = output.node;
          let srcExhibit = otherNode.data.exhibit as ExhibitProperties;
          if (!srcExhibit)
            continue;

          let action = {
            effect: input[0]
          } as Action;

          // TODO: consolidate types
          switch (input[1].socket) {
            case voidSocket:
              break;
          }

          action.mapping = this.createActionMapping(output, srcExhibit, srcExhibit.hostname === exhibit);
          inputs.push(action);
        }
      }

      let result = '[';
      let count = 0;
      for (let input of inputs) {
        //result += Convert.actionToJson(input);
        count++;
        if (count < inputs.length)
          result += ',';
      }
      result += ']';

      return result;
    }
    return '';
  }

  createActionMapping(output: ReteOutput, exhibit: ExhibitProperties, isRelative: boolean): Mapping {
    let result = {} as Mapping;
    if (isRelative) {
      result.source = '';
    } else {
      result.source = '/' + exhibit.hostname + '/';
    }
    // TODO: better mapping, allow conditions and range mapping
    switch (output.socket) {
      case voidSocket:
        result.source += output.key;
        break;
    }
    return result;
  }

  getIncludedExhibits(): string[] {
    let exhibits = [];
    for (let node of this.editor.nodes) {
      if (node.data.exhibit) {
        let dev = node.data.exhibit as ExhibitProperties;
        exhibits.push(dev.hostname);
      } else if (node.data.exhibits) {
        let devs = node.data.exhibits as ExhibitProperties[];
        exhibits.push(...(devs.map(ex => ex.hostname)));
      }
    }
    return exhibits;
  }

  saveGraph() {
    this.expositionClient.setGraph(this.expositionId, JSON.stringify(this.editor.toJSON())).subscribe(_ => { /* IGNORE */ });
  }

  loadGraph() {
    this.expositionClient.getGraph(this.expositionId).subscribe(data => {
      if (data) {
        this.editor.fromJSON(JSON.parse(data));
      }
    })
  }

  addCustomInput(exhibit: string, input: CustomInput) {
    let node = this.findNodeByExhibit(exhibit);
    if (node) {
      this.singleDeviceComponent.addCustomInput(node, input);
    }
  }

  addCustomOutput(exhibit: string, output: CustomOutput) {
    let node = this.findNodeByExhibit(exhibit);
    if (node) {
      this.singleDeviceComponent.addCustomOutput(node, output);
    }
  }

  initMultideviceSync(exhibits: ExhibitProperties[]) {
    let sync = {} as Sync;

    // TODO: better setup
    sync.canvasDimensions = {
      width: exhibits.reduce((val, ex, _) => val + (ex.hostname.startsWith('ipw') ? 4096 : 2048), 0),
      height: exhibits.reduce((val, ex, _) => 2048, 0)
    } as CanvasDimensions;

    sync.elements = [];
    sync.elements.push(...(exhibits.map((ex, i) => {
      return {
        hostname: ex.hostname,
        role: '',
        viewportTransform: (ex.hostname.startsWith('ipw') ? '4096x2048+' : '2048x2048+')
      } as Element
    })));
    let xoffset = 0;
    for (let el of sync.elements) {
      el.viewportTransform += (xoffset + '+0');
      xoffset += parseInt(el.viewportTransform.substring(0, el.viewportTransform.indexOf('x')));
    }

    return Convert.syncToJson(sync);
  }
}

export interface DeviceRemovedArgs {
  devices: ExhibitProperties[],
  overlays: PackageOverlayProperties[]
}