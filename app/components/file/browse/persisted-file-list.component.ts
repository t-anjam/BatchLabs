import { Component, Input, OnChanges, OnDestroy } from "@angular/core";
import { autobind } from "core-decorators";
import { BehaviorSubject, Observable, Subscription } from "rxjs";

import { LoadingStatus } from "app/components/base/loading";
import { File, ServerError } from "app/models";
import { ListBlobParams, StorageService } from "app/services";
import { RxListProxy } from "app/services/core";
import { Constants, StorageUtils } from "app/utils";
import { Property } from "app/utils/filter-builder";

@Component({
    selector: "bl-persisted-file-list",
    templateUrl: "persisted-file-list.html",
})
export class PersistedFileListComponent implements OnChanges, OnDestroy {
    @Input()
    public quickList: boolean;

    @Input()
    public jobId: string;

    @Input()
    public taskId: string;

    @Input()
    public outputKind: string;

    @Input()
    public container: string;

    @Input()
    public filter: Property;

    @Input()
    public manualLoading: boolean;

    public data: RxListProxy<ListBlobParams, File>;
    public status = new BehaviorSubject(LoadingStatus.Loading);
    public LoadingStatus = LoadingStatus;
    public hasAutoStorage: boolean;
    public containerNotFound: boolean;
    public authFailed: boolean;

    private _autoStorageSub: Subscription;
    private _statuSub: Subscription;

    constructor(private storageService: StorageService) {
        this.data = this.storageService.listBlobs(null, null, (error: ServerError) => {
            let handled = false;
            if (error && error.body && error.body.code === Constants.APIErrorCodes.containerNotFound) {
                this.containerNotFound = true;
                handled = true;
            } else if (error && error.body && error.body.code === Constants.APIErrorCodes.authenticationFailed) {
                this.authFailed = true;
                // try refreshing the keys cache so we get them from the API again.
                this.storageService.clearCurrentStorageKeys();
                handled = true;
            }

            return !handled;
        });

        this._statuSub = this.data.status.subscribe((status) => {
            this.status.next(status);
        });

        this.hasAutoStorage = false;
        this._autoStorageSub = storageService.hasAutoStorage.subscribe((hasAutoStorage) => {
            this.hasAutoStorage = hasAutoStorage;
            if (!hasAutoStorage) {
                this.status.next(LoadingStatus.Ready);
            }
        });
    }

    public ngOnChanges(inputs) {
        if (inputs.container || inputs.jobId || inputs.taskId || inputs.filter) {
            this.refresh();
        }
    }

    public ngOnDestroy() {
        this.status.unsubscribe();
        this._autoStorageSub.unsubscribe();
        this._statuSub.unsubscribe();
    }

    @autobind()
    public refresh(): Observable<any> {
        if (!this.hasAutoStorage || (!this.container && !(this.jobId && this.taskId && this.outputKind))) {
            this.status.next(LoadingStatus.Ready);
            return;
        }

        this.authFailed = false;
        this.containerNotFound = false;
        const prefix = !this.container ? `${this.taskId}/${this.outputKind}/` : null;
        const containerPromise = !this.container
            ? StorageUtils.getSafeContainerName(this.jobId)
            : Promise.resolve(this.container);

        this.data.updateParams({ container: containerPromise, blobPrefix: prefix });
        this.data.setOptions(this._buildOptions());

        return this.data.fetchNext(true);
    }

    @autobind()
    public loadMore(): Observable<any> {
        if (this.data && this.hasAutoStorage) {
            return this.data.fetchNext();
        }

        return new Observable(null);
    }

    public get baseUrl() {
        return this.container
            ? ["/data", this.container]
            : ["/jobs", this.jobId, "tasks", this.taskId, this.outputKind];
    }

    public get filterPlaceholder() {
        return "Filter by blob name (case sensitive)";
    }

    private _buildOptions() {
        let options = {};
        if (!this.filter.isEmpty()) {
            const filterText = this.filter.properties.length > 0
                ? (this.filter.properties[0] as any).value
                : this.filter.value;
            options = { filter: filterText };
        }

        return options;
    }
}
