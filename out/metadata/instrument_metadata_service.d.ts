import { MetadataSymbol } from "./metadata_shared.js";
export declare class InstrumentMetadataService {
    private readonly _uri;
    private readonly _demux;
    constructor(uri: string);
    getSymbolMetadata(symbol: string, signal: AbortSignal): Promise<MetadataSymbol | undefined>;
    private getSymbolMetadataInternal;
}
