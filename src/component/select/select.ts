import {
    Component, Input, Output, EventEmitter, ViewChild, forwardRef, Renderer2,
    OnInit, ViewEncapsulation, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef,
} from '@angular/core';
import { SelectConfig, OptionsStyles } from './select.config';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { OverlayComponent } from '../overlay';
import { Placement } from '../util/position';
import { BUTTON_THEME, BUTTON_SIZE } from '../button';
import { OverlayOriginDirective } from '../overlay/overlay-origin.directive';

@Component({
    selector: 'nb-select',
    templateUrl: './select.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false,
    host: {
        'class': 'nb-widget nb-select',
        '[class.disabled]': 'disabled',
        '[class.nb-widget-disabled]': 'disabled'
    },
    exportAs: 'nbSelect',
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => SelectComponent),
        multi: true
    }]
})
export class SelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
    @ViewChild('origin') origin: OverlayOriginDirective;
    @ViewChild('overlay') overlay: OverlayComponent;
    @Input() datasource: SelectConfig[] = [];
    @Input() theme: BUTTON_THEME = 'default';
    @Input() size: BUTTON_SIZE = 'default';
    @Input() defaultLabel: string;
    @Input() searchable: boolean = false;
    @Input() disabled: boolean = false;
    @Input() value: number | null | undefined;
    @Output() onChange: EventEmitter<SelectConfig> = new EventEmitter();
    @Output() onPanelShow: EventEmitter<Object> = new EventEmitter();
    @Output() onPanelHide: EventEmitter<Object> = new EventEmitter();

    icon: string = 'icon-down';
    selectedData: SelectConfig;
    styles: OptionsStyles;
    protected expanded: boolean = false;
    protected windowResizeListener: Function | null;
    protected onModelChange: Function = () => { };
    protected onModelTouched: Function = () => { };

    placement: Placement = 'bottom-left';

    constructor(private cd: ChangeDetectorRef) {
    }

    ngOnInit() {
        this.selectedData = { value: null, label: this.defaultLabel || '请选择' };
        this.overlay.origin = this.origin;
    }

    onToggle() {
        this.changeState();

        if (this.expanded) {
            this.bindEvents();
        }
    }

    show() {
        this.overlay.show();
    }

    hide() {
        this.overlay.hide();
    }

    toggleOverlay() {
        this.overlay.isVisible() ? this.hide() : this.show();
    }

    changeState() {
        this.toggleOverlay();

        this.expanded = !this.expanded;
        this.icon = this.expanded ? 'icon-up' : 'icon-down';
        this.cd.markForCheck();
    }

    onSelectedOption(data: SelectConfig) {
        this.selectedData = data;
        this.value = this.selectedData.value;
        this.onChange.emit({
            value: this.selectedData.value,
            label: this.selectedData.label
        });
        this.onModelChange(this.selectedData);
        this.changeState();
        this.onModelTouched();
        this.setSelectedData();
        this.cd.markForCheck();
    }

    clear() {
        this.selectedData = { value: null, label: this.defaultLabel || '请选择' };
        this.cd.markForCheck();
    }

    bindEvents() {

    }

    unbindEvents() {
        if (this.windowResizeListener) {
            this.windowResizeListener();
            this.windowResizeListener = null;
        }

    }

    setSelectedData() {
        this.datasource.forEach((data) => {
            if (data.value === this.value) {
                this.selectedData = data;
                this.cd.markForCheck();
            }
        });
    }

    writeValue(value: number) {
        if (value === null) {
            return;
        }

        this.value = value;
        this.setSelectedData();
    }

    registerOnChange(fn: Function) {
        this.onModelChange = fn;
        this.cd.markForCheck();
    }

    registerOnTouched(fn: Function) {
        this.onModelTouched = fn;
        this.cd.markForCheck();
    }

    ngOnDestroy() {
        this.unbindEvents();
    }
}
