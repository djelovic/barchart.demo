import { MetadataSymbol } from "./metadata_shared.js";
import { ExchangesService } from "./exchanges_service.js";
export declare class BranchChildren {
    readonly branches: ReadonlyArray<TreeBranch>;
    readonly symbols: ReadonlyArray<MetadataSymbol>;
    constructor(branches: ReadonlyArray<TreeBranch>, symbols: ReadonlyArray<MetadataSymbol>);
}
export interface TreeBranch {
    getChildren(signal: AbortSignal): Promise<BranchChildren>;
    readonly name: string;
}
export declare class SymbolTreeService {
    private readonly _uri;
    private readonly _demux;
    private readonly _exchangeService;
    constructor(exchangeService: ExchangesService, uri?: string);
    getRoot(signal: AbortSignal): Promise<TreeBranch>;
    private getRootInternal;
}
