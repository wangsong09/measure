import { Component, ViewEncapsulation, OnInit } from '@angular/core';

import { FormGroup, FormBuilder } from '@angular/forms';

@Component({
    selector: 'demo-button-group-form',
    templateUrl: './button-group-form.html',
    styleUrls: ['./button-group-form.less'],
    encapsulation: ViewEncapsulation.None
})
export class ButtonGroupFormDemo implements OnInit {
    formGroup: FormGroup;

    datasource: any[] = [
        {value: 'apple', text: 'apple <b>a</b>'},
        {value: 'book', text: 'book', checked: true },
        {value: 'falsh', text: 'flash' }
    ];

    constructor(private fb: FormBuilder) {

    }

    ngOnInit() {
        this.formGroup = this.fb.group({
            fruits: [['book']]
        });
    }
}
