import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CodeBoxModule } from '../../component/code-box';
import { CodeHighlighterModule } from '../../component/code-highlighter';
import { SideBarModule } from '../../component/side-bar';

import { SideBarDemo } from './side-bar';
import { SideBarBasicDemo } from './basic/side-bar-basic';

@NgModule({
    imports: [
        CommonModule,
        CodeBoxModule,
        CodeHighlighterModule,
        SideBarModule
    ],
    declarations: [
        SideBarDemo,
        SideBarBasicDemo
    ],
    providers: [],
    exports: []
})

export class SideBarDemoModule { }
