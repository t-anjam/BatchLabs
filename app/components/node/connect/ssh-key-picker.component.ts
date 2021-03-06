import { Component, ElementRef, OnDestroy, ViewChild, forwardRef } from "@angular/core";
import { ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR } from "@angular/forms";
import { autobind } from "core-decorators";
import { List } from "immutable";
import { Subscription } from "rxjs";

import { SSHPublicKey } from "app/models";
import { SSHKeyService } from "app/services";

@Component({
    selector: "bl-ssh-key-picker",
    templateUrl: "ssh-key-picker.html",
    providers: [
        // tslint:disable:no-forward-ref
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SSHKeyPickerComponent), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => SSHKeyPickerComponent), multi: true },
    ],
})
export class SSHKeyPickerComponent implements OnDestroy, ControlValueAccessor {
    public savedSSHKeys: List<SSHPublicKey> = List([]);
    public sshKeyValue = new FormControl("");
    public sshKeyName = new FormControl("");
    public showSaveForm = false;

    @ViewChild("nameInput")
    public nameInput: ElementRef;

    private _subs: Subscription[] = [];
    private _propagateChange: (value: string) => void = null;

    constructor(private sshKeyService: SSHKeyService) {
        this._subs.push(sshKeyService.keys.subscribe((keys) => {
            this.savedSSHKeys = keys;
        }));
        this._subs.push(this.sshKeyValue.valueChanges.subscribe((value) => {
            if (this._propagateChange) {
                this._propagateChange(value);
            }
        }));
    }

    public ngOnDestroy() {
        this._subs.forEach(x => x.unsubscribe());
    }

    public writeValue(value: any) {
        this.sshKeyValue.patchValue(value);
    }

    public registerOnChange(fn) {
        this._propagateChange = fn;
    }

    public registerOnTouched() {
        // Do nothing
    }

    public validate(c: FormControl) {
        const valid = this.sshKeyValue.valid;

        if (!valid) {
            return {
                sshKeyPicker: {
                    valid: false,
                    missingSelection: true,
                },
            };
        }

        return null;
    }

    @autobind()
    public addKey() {
        this.showSaveForm = true;
        setTimeout(() => {
            this.nameInput.nativeElement.focus();
        });
    }

    @autobind()
    public cancelAddKey() {
        this.showSaveForm = false;
        this.sshKeyName.patchValue("");
    }

    @autobind()
    public saveKey() {
        const value = this.sshKeyValue.value;
        const name = this.sshKeyName.value;

        this.sshKeyService.saveKey(new SSHPublicKey({
            name,
            value,
        }));
        this.showSaveForm = false;
    }

    public selectKey(key: SSHPublicKey) {
        this.sshKeyValue.patchValue(key.value);
    }

    public deleteKey(key: SSHPublicKey) {
        this.sshKeyService.deleteKey(key);
    }
}
