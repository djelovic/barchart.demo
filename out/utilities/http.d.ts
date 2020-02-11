import { Abortable } from "./async.js";
export declare type AbortableRequestInit = Omit<RequestInit, "signal"> & Abortable;
export declare class HttpError extends Error {
    status: number;
    statusText: string;
    responseText: string;
    constructor(status: number, statusText: string, responseText: string);
    static throwOnError(response: Response, responseText: string): void;
}
export declare function fetchWithRetries(request: RequestInfo, init: AbortableRequestInit): Promise<Response>;
export declare function fetchTextWithRetries(request: RequestInfo, init: AbortableRequestInit): Promise<string>;
export declare function fetchJsonWithRetries(request: RequestInfo, init: AbortableRequestInit): Promise<any>;
