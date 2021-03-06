import { ModuleWithProviders, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { RouterModule } from "@angular/router";

import { FocusSectionModule } from "../focus-section";
import { TableCellComponent } from "./table-cell.component";
import { TableColumnComponent } from "./table-column.component";
import { TableRowComponent } from "./table-row.component";
import {
    TableComponent,
    TableHeadComponent,
} from "./table.component";

const components = [
    TableCellComponent,
    TableColumnComponent,
    TableComponent,
    TableHeadComponent,
    TableRowComponent,
];

@NgModule({
    imports: [
        BrowserModule,
        RouterModule,
        FocusSectionModule,
    ],
    exports: components,
    declarations: components,
    providers: [],
})
export class TableModule {
    public static forRoot(): ModuleWithProviders {
        return {
            ngModule: TableModule,
            providers: [],
        };
    }
}
