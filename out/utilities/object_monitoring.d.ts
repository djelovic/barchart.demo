export declare type PropertyChangedCallback<T extends object> = (target: T, property: PropertyKey) => void;
export declare type ArrayChangedCallback<T> = (target: ReadonlyArray<T>, index: number, inserted: number, deleted: number) => void;
export interface PropertyChangedListener<T extends object> {
    propertyChangedCallback(target: T, property: PropertyKey): void;
}
export interface ArrayChangedListener<T> {
    arrayChangedCallback(target: ReadonlyArray<T>, index: number, inserted: number, deleted: number): void;
}
export interface ObjectObserver<T extends object> {
    addPropertyChangedListener(listener: PropertyChangedCallback<T> | PropertyChangedListener<T>): void;
    removePropertyChangedListener(listener: PropertyChangedCallback<T> | PropertyChangedListener<T>): void;
}
export interface ArrayObserver<T> {
    addArrayListener(listener: ArrayChangedCallback<T> | ArrayChangedListener<T>): void;
    removeArrayListener(listener: ArrayChangedCallback<T> | ArrayChangedListener<T>): void;
}
export declare function getObjectMonitor<T extends object>(obj: T): (T extends ReadonlyArray<infer U> ? ArrayObserver<U> : ObjectObserver<T>) | undefined;
export declare function toMonitoredObject<T extends object>(obj: T): T;
export declare function evaluateAndGetDependencies(thisArg: any, s: string, outDependencies: object[]): any;
