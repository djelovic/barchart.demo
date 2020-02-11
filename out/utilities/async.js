export function sleepAsync(timeout, abortSignal) {
    return new Promise((resolve, reject) => {
        var _a;
        if (abortSignal !== undefined && abortSignal.aborted) {
            reject(abortSignal);
        }
        else {
            let timerId = 0;
            let abortListener = () => {
                clearTimeout(timerId);
                reject(abortSignal);
            };
            (_a = abortSignal) === null || _a === void 0 ? void 0 : _a.addEventListener('abort', abortListener);
            timerId = setTimeout(() => {
                var _a;
                (_a = abortSignal) === null || _a === void 0 ? void 0 : _a.removeEventListener('abort', abortListener);
                resolve();
            }, timeout);
        }
    });
}
export class CallDemultiplexer {
    constructor(realFunc, cacheSeconds) {
        this._nextAwaiterId = 0;
        this._nextInFlightId = 0;
        this._awaiters = new Map();
        this._realFunc = realFunc;
        this._cacheSeconds = cacheSeconds;
    }
    call(signal) {
        return new Promise((resolve, reject) => {
            if (signal.aborted) {
                reject(signal);
            }
            else if (this._cachedResult) {
                if (this._cachedResult.isError) {
                    reject(this._cachedResult.error);
                }
                else {
                    resolve(this._cachedResult.result);
                }
            }
            else {
                const id = ++this._nextAwaiterId;
                const abortListener = () => {
                    const awaiter = this._awaiters.get(id);
                    if (awaiter !== undefined) {
                        this._awaiters.delete(id);
                        if (this._awaiters.size == 0) {
                            const current = this._current;
                            this._current = undefined;
                            if (current !== undefined) {
                                ++this._nextInFlightId;
                                current.abort.abort();
                            }
                        }
                        awaiter.reject(awaiter.signal);
                    }
                };
                this._awaiters.set(id, { resolve: resolve, reject: reject, signal: signal, abortListener: abortListener });
                signal.addEventListener("abort", abortListener);
                if (this._current === undefined) {
                    const inFlightId = ++this._nextInFlightId;
                    const ac = new AbortController();
                    const promise = this._realFunc(ac.signal);
                    this._current = { inFlight: promise, abort: ac };
                    promise.then(val => {
                        if (inFlightId == this._nextInFlightId) {
                            this._current = undefined;
                            if (this._cacheSeconds !== 0) {
                                this._cachedResult = { result: val, isError: false };
                                if (this._cacheSeconds > 0) {
                                    this.clearCacheAfterTimeout();
                                }
                            }
                            const awaiters = Array.from(this._awaiters.values());
                            this._awaiters.clear();
                            for (const awaiter of awaiters) {
                                awaiter.signal.removeEventListener("abort", awaiter.abortListener);
                                awaiter.resolve(val);
                            }
                        }
                    }, rejectReason => {
                        if (inFlightId == this._nextInFlightId) {
                            this._current = undefined;
                            if (this._cacheSeconds !== 0) {
                                this._cachedResult = { error: rejectReason, isError: true };
                                if (this._cacheSeconds > 0) {
                                    this.clearCacheAfterTimeout();
                                }
                            }
                            const awaiters = Array.from(this._awaiters.values());
                            this._awaiters.clear();
                            for (const awaiter of awaiters) {
                                awaiter.signal.removeEventListener("abort", awaiter.abortListener);
                                awaiter.reject(rejectReason);
                            }
                        }
                    });
                }
            }
        });
    }
    async clearCacheAfterTimeout() {
        await sleepAsync(this._cacheSeconds);
        this._cachedResult = undefined;
    }
}
//# sourceMappingURL=async.js.map