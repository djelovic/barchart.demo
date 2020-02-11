import { MetadataSymbol } from "./metadata_shared.js";
import { RootSymbolService } from "./root_symbol_service.js";
export declare class SymbolSearchService {
    private _uri;
    private _rootSymbolService;
    constructor(rootSymbolService: RootSymbolService, uri?: string);
    private static tryParseAlias;
    private rootSearch;
    private ensureWireSymbol;
    private ensureResponse;
    private realSearch;
    search(pattern: string, exchanges: readonly string[], typeCode: number | undefined, signal: AbortSignal): Promise<readonly MetadataSymbol[]>;
}
