import { CallDemultiplexer } from "../utilities/async.js";
export declare class Exchange {
    readonly id: string;
    readonly description: string;
    readonly timeZone?: string;
    constructor(id: string, description: string, timeZone?: string);
}
export declare class ExchangesService {
    readonly _uri: string;
    readonly _demux: CallDemultiplexer<ReadonlyMap<string, Exchange>>;
    constructor(uri?: string);
    private static ensureWireExchange;
    private getExchangesInternal;
    getExchanges(signal: AbortSignal): Promise<ReadonlyMap<string, Exchange>>;
}
