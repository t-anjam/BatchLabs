import { Component, OnDestroy } from "@angular/core";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { autobind } from "core-decorators";
import { Observable, Subscription } from "rxjs";

import { NotificationService } from "app/components/base/notifications";
import { SidebarRef } from "app/components/base/sidebar";
import { DynamicForm } from "app/core";
import { Pool } from "app/models";
import { NodeFillType } from "app/models";
import { PoolCreateDto } from "app/models/dtos";
import { PoolOsSources, createPoolToData, poolToFormModel } from "app/models/forms";
import { PoolService, VmSizeService } from "app/services";
import { Constants } from "app/utils";

@Component({
    selector: "bl-pool-create-basic-dialog",
    templateUrl: "pool-create-basic-dialog.html",
})
export class PoolCreateBasicDialogComponent extends DynamicForm<Pool, PoolCreateDto> implements OnDestroy {
    public osSource: PoolOsSources = PoolOsSources.IaaS;
    public osType: "linux" | "windows" = "linux";
    public NodeFillType = NodeFillType;

    private _osControl: FormControl;
    private _licenseControl: FormControl;
    private _renderingSkuSelected: boolean = false;
    private _sub: Subscription;

    constructor(
        private formBuilder: FormBuilder,
        public sidebarRef: SidebarRef<PoolCreateBasicDialogComponent>,
        private poolService: PoolService,
        vmSizeService: VmSizeService,
        private notificationService: NotificationService) {
        super(PoolCreateDto);

        this._osControl = this.formBuilder.control({}, Validators.required);
        this._licenseControl = this.formBuilder.control([]);

        this.form = formBuilder.group({
            id: ["", [
                Validators.required,
                Validators.maxLength(64),
                Validators.pattern(Constants.forms.validation.regex.id),
            ]],
            displayName: "",
            scale: [null],
            os: this._osControl,
            // note: probably not advisable to default vmSize value
            vmSize: ["", Validators.required],
            maxTasksPerNode: 1,
            enableInterNodeCommunication: false,
            taskSchedulingPolicy: [NodeFillType.pack],
            startTask: null,
            userAccounts: [[]],
            appLicenses: [[]],
        });

        this._sub = this._osControl.valueChanges.subscribe((value) => {
            this.osSource = value.source;
            if (value.source === PoolOsSources.PaaS) {
                this._renderingSkuSelected = false;
                this.osType = "windows";
            } else {
                const config = value.virtualMachineConfiguration;
                const agentId: string = config && config.nodeAgentSKUId;
                this._renderingSkuSelected = config && config.imageReference
                    && config.imageReference.publisher === "batch";

                if (agentId && agentId.toLowerCase().indexOf("windows") !== -1) {
                    this.osType = "windows";
                } else {
                    this.osType = "linux";
                }
            }
        });
    }

    public ngOnDestroy() {
        this._sub.unsubscribe();
    }

    @autobind()
    public submit(): Observable<any> {
        const id = this.form.value.id;
        const data = this.getCurrentValue();
        const obs = this.poolService.add(data);
        obs.subscribe({
            next: () => {
                this.poolService.onPoolAdded.next(id);
                this.notificationService.success("Pool added!", `Pool '${id}' was created successfully!`);
            },
            error: () => null,
        });

        return obs;
    }

    public dtoToForm(pool: PoolCreateDto) {
        return poolToFormModel(pool);
    }

    public formToDto(data: any): PoolCreateDto {
        return createPoolToData(data);
    }

    public get startTask() {
        return this.form.controls.startTask.value;
    }

    public get renderingSkuSelected(): boolean {
        return this._renderingSkuSelected;
    }
}
