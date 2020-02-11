export declare type PropertyChangedListener<T extends object> = (target: T, property: PropertyKey) => void;
export declare type ArrayListener<T> = (target: Array<T>, index: number, inserted: number, deleted: number) => void;
export interface ObjectObserver<T extends object> {
    addPropertyChangedListener(listener: PropertyChangedListener<T>): void;
    removePropertyChangedListener(listener: PropertyChangedListener<T>): void;
}
export interface ArrayObserver<T> {
    addArrayListener(listener: ArrayListener<T>): void;
    removeArrayListener(listener: ArrayListener<T>): void;
}
export declare function getObjectMonitor<T extends object>(obj: T): (T extends ReadonlyArray<infer U> ? ArrayObserver<U> : ObjectObserver<T>) | undefined;
export declare function toMonitoredObject<T extends object>(obj: T): T;
