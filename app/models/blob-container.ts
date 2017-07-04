import { List } from "immutable";

import { ListProp, Model, Prop, Record } from "app/core";
import { ContainerLease, ContainerLeaseAttributes } from "./container-lease";
import { Metadata, MetadataAttributes } from "./metadata";

export interface BlobContainerAttributes {
    id: string;
    name: string;
    publicAccessLevel: string;
    metadata?: MetadataAttributes[];
    lastModified: Date;
    lease?: Partial<ContainerLeaseAttributes>;
}

/**
 * Class for displaying blob container information.
 */
@Model()
export class BlobContainer extends Record<BlobContainerAttributes> {
    // container name
    @Prop() public id: string;

    // container name with the prefix removed
    @Prop() public name: string;

    @Prop() public publicAccessLevel: string;
    @Prop() public lastModified: Date;
    @Prop() public lease: ContainerLease;
    @ListProp(Metadata) public metadata: List<Metadata> = List([]);

    constructor(data: Partial<BlobContainerAttributes> = {}) {
        super(data);
    }
}