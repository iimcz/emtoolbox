import { Component, Input, Type } from '@angular/core';
import { Control } from 'rete';
import { AngularControl } from 'rete-angular-render-plugin';
import { DataType } from 'src/app/services/api.generated.service';

@Component({
    templateUrl: './constant.control.html',
    styleUrls: ['./constant.control.css']
})
export class ConstantComponent {
    @Input() valueType!: DataType;
    @Input() valueBool!: boolean;
    @Input() valueNumber!: number;
    @Input() valueString!: string;

    @Input() change!: Function;
    @Input() mounted!: Function;

    dtype: number;

    ngOnInit() {
        this.mounted();
        this.dtype = this.valueType;
    }
}

export class ConstantControl extends Control implements AngularControl {
    component: Type<ConstantComponent>
    props: { [key: string]: unknown }

    constructor(public key, valueType: DataType, private changeCallback: Function) {
        super(key);

        this.component = ConstantComponent;
        this.props = {
            valueType: valueType,
            valueBool: false,
            valueNumber: 0,
            valueString: '',
            change: v => this.onChange(v),
            mounted: () => {
                this.setValue((this.getData(key) as any))
            }
        };
    }

    onChange(val: any) {
        this.setValue(val);
        this.changeCallback(val);
    }

    setValue(val: any) {
        switch (this.props.valueType) {
            case DataType.Bool:
                this.props.valueBool = val;
                break;
            case DataType.Integer:
            case DataType.Float:
                this.props.valueNumber = val;
                break;
            case DataType.String:
                this.props.valueString = val;
                break;
        }
        this.putData(this.key, val);
    }
}