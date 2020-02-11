import { MetadataSymbol } from "./metadata_shared.js";
export declare class SymbolAndAlias {
    readonly symbol: MetadataSymbol;
    readonly alias: MetadataSymbol;
    constructor(symbol: MetadataSymbol, alias: MetadataSymbol);
}
export declare class RootSymbolsResult {
    readonly symbols: ReadonlyArray<SymbolAndAlias>;
    readonly nearby?: SymbolAndAlias;
    constructor(symbols: ReadonlyArray<SymbolAndAlias>, nearby?: SymbolAndAlias);
}
export declare class RootSymbolService {
    private _uri;
    private static _monthNames;
    constructor(uri?: string);
    getRootSymbols(root: string, exchanges: readonly string[], signal: AbortSignal): Promise<RootSymbolsResult>;
}
