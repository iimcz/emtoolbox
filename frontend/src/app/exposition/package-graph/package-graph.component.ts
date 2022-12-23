import { NodeEditor, Input as ReteInput, Output as ReteOutput } from 'rete';
import ConnectionPlugin from 'rete-connection-plugin';
import { AngularRenderPlugin } from 'rete-angular-render-plugin';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ViewDeviceComponent } from './rete-components/view-device-component';

import { ExhibitClient, ExhibitProperties, ExpositionClient, ExpositionProperties, PackageOverlayProperties, PackageProperties, ValueType } from 'src/app/services/api.generated.service';
import { DeviceDetailControl } from './controls/device-detail.control';
import { CustomInput, CustomOutput } from 'src/app/overlays/overlay-detail/overlay-detail.component';
import { boolSocket, complexSocket, eventSocket, numberSocket, voidSocket } from './rete-sockets';
import { Action, CanvasDimensions, Convert, Mapping, Type } from 'src/app/model/package';
import { MultiViewDeviceComponent } from './rete-components/multiview-device-component';
import { Observable, of, scheduled } from 'rxjs';
import { map, mergeMap, zipAll } from 'rxjs/operators';
import { PackageDetailControl } from './controls/package-detail.control';
import { Sync, Element } from 'src/app/model/package';

@Component({
  selector: 'app-package-graph',
  templateUrl: './package-graph.component.html',
  styleUrls: ['./package-graph.component.css']
})
export class PackageGraphComponent implements AfterViewInit {
  @Input() expositionId: number;
  @Output() onDeviceSelected = new EventEmitter<{}>();

  @ViewChild('nodeEditor') el: ElementRef;
  editor: NodeEditor = null;

  singleDeviceComponent = new ViewDeviceComponent();
  multiDeviceComponent = new MultiViewDeviceComponent();

  constructor(
    private expositionClient: ExpositionClient,
    private deviceClient: ExhibitClient,
  ) { }

  async ngAfterViewInit() {
    this.editor = new NodeEditor('package-graph@0.0.1', this.el.nativeElement);
    this.editor.use(ConnectionPlugin);
    console.log('AngularRenderPlugin', AngularRenderPlugin);
    this.editor.use(AngularRenderPlugin);

    this.editor.register(this.singleDeviceComponent);
    this.editor.register(this.multiDeviceComponent);
    this.editor.view.resize();

    this.loadGraph();

    this.editor.on(['nodedragged', 'connectioncreated', 'connectionremoved', 'keyup', 'resetconnection'], (args: any) => {
      this.saveGraph();
    });

    this.editor.on(['nodeselected'], (node) => {
      let dev = node.data.exhibit as ExhibitProperties;
      let devs = node.data.exhibits as ExhibitProperties[];
      this.onDeviceSelected.emit(dev?.hostname ?? devs[0].hostname);
    });
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
        this.singleDeviceComponent.createNode({ exhibit: exhibit }).then(n => this.editor.addNode(n));
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
        this.multiDeviceComponent.createNode({ exhibits: data }).then(n => this.editor.addNode(n));
      });
    }
  } 

  getExhibit(exhibit: string) {
    let node = this.findNodeByExhibit(exhibit);
    if (node) {
      // TODO: handle better to avoid redundant find
      if (node.data.exhibit)
        return node.data.exhibit;
      else
        return (node.data.exhibits as ExhibitProperties[]).find(ex => ex.hostname === exhibit);
    }
  }

  setPackage(exhibit: string, pkg: PackageProperties) {
    let node = this.findNodeByExhibit(exhibit);
    if (node) {
      node.data.package = pkg;
      let packageControl = node.controls.get('pkg') as PackageDetailControl;
      if (packageControl) {
        packageControl.setPackage(pkg);
      }
    }
  }

  getPackage(exhibit: string): PackageProperties {
    let node = this.findNodeByExhibit(exhibit);
    if (node) {
      return node.data.package as PackageProperties;
    }
  }

  setOverlay(exhibit: string, overlay: PackageOverlayProperties) {
    let node = this.findNodeByExhibit(exhibit);
    if (node) {
      if (node.data.exhibits && !overlay.sync) {
        overlay.sync = this.initMultideviceSync(node.data.exhibits as ExhibitProperties[]);
      }
      node.data.overlay = overlay;
    }
    return null;
  }

  getOverlay(exhibit: string): PackageOverlayProperties {
    let node = this.findNodeByExhibit(exhibit);
    if (node) {
      return node.data.overlay as PackageOverlayProperties;
    }
    return null;
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
            case eventSocket:
              action.type = Type.Event;
              break;
            case boolSocket:
            case numberSocket:
            case complexSocket:
              action.type = Type.Value;
              break;
          }

          action.mapping = this.createActionMapping(output, srcExhibit, srcExhibit.hostname === exhibit);
          inputs.push(action);
        }
      }

      let result = '[';
      let count = 0;
      for (let input of inputs) {
        result += Convert.actionToJson(input);
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
      case eventSocket:
        result.eventName = output.key.substring(output.key.indexOf(':') + 1);
        result.source += output.key.substring(0, output.key.indexOf(':'));
        break;
      case numberSocket:
      case boolSocket:
      case complexSocket:
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
      } else {
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
      if (!node.data.additionalInputs) {
        node.data.additionalInputs = new Array<CustomInput>();
      }
      (node.data.additionalInputs as CustomInput[]).push(
        input
      );
      switch (input.type) {
        case ValueType.Void:
          node.addInput(new ReteInput(input.effect, input.effect, voidSocket))
          break;
        case ValueType.Bool:
          node.addInput(new ReteInput(input.effect, input.effect, boolSocket))
          break;
        case ValueType.Number:
          node.addInput(new ReteInput(input.effect, input.effect, numberSocket))
          break;
        case ValueType.Event:
          node.addInput(new ReteInput(input.effect, input.effect, eventSocket))
          break;
        case ValueType.Complex:
          node.addInput(new ReteInput(input.effect, input.effect, complexSocket))
          break;
      }
      node.update();
    }
  }

  addCustomOutput(exhibit: string, output: CustomOutput) {
    let node = this.findNodeByExhibit(exhibit);
    if (node) {
      if (!node.data.additionalOutputs) {
        node.data.additionalOutputs = new Array<CustomOutput>();
      }
      (node.data.additionalOutputs as CustomOutput[]).push(
        output
      );
      switch (output.type) {
        case ValueType.Void:
          node.addOutput(new ReteOutput(output.path, output.path, voidSocket))
          break;
        case ValueType.Bool:
          node.addOutput(new ReteOutput(output.path, output.path, boolSocket))
          break;
        case ValueType.Number:
          node.addOutput(new ReteOutput(output.path, output.path, numberSocket))
          break;
        case ValueType.Event:
          node.addOutput(new ReteOutput(output.path, output.path, eventSocket))
          break;
        case ValueType.Complex:
          node.addOutput(new ReteOutput(output.path, output.path, complexSocket))
          break;
      }
      node.update();
    }
  }

  initMultideviceSync(exhibits: ExhibitProperties[]) {
    let sync = {} as Sync;

    // TODO: better setup
    sync.canvasDimensions = {
      width: exhibits.reduce((val, ex, _) => val + (ex.hostname.startsWith('ipw') ? 4096 : 2048), 0),
      height: exhibits.reduce((val, ex, _) => 2048, 0)
    } as CanvasDimensions;

    sync.selfIndex = 0;

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
