export declare type PromiseGetter<T> = (signal: AbortSignal) => Promise<T>;
export interface Abortable {
    signal: AbortSignal;
}
export declare function sleepAsync(timeout: number, abortSignal?: AbortSignal): Promise<unknown>;
export declare class CallDemultiplexer<T> {
    private readonly _realFunc;
    private readonly _cacheSeconds;
    private _nextAwaiterId;
    private _nextInFlightId;
    private _current?;
    private _cachedResult?;
    private readonly _awaiters;
    constructor(realFunc: PromiseGetter<T>, cacheSeconds: number);
    call(signal: AbortSignal): Promise<T>;
    clearCacheAfterTimeout(): Promise<void>;
}
