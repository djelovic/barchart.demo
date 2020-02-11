export declare function getPreviousElement<K extends T, T>(iterable: Iterable<K>, element: T): K | undefined;
export declare function getNextElement<K extends T, T>(iterable: Iterable<K>, element: T): K | undefined;
export declare function first<T>(iterable: Iterable<T>, condition?: (arg: T) => boolean): T | undefined;
export declare function last<T>(iterable: Iterable<T>, condition?: (arg: T) => boolean): T | undefined;
export declare function indexOf<T>(iterable: Iterable<T>, val: T): number;
export declare function indexOfOrEnd<T>(iterable: Iterable<T>, val: T): number;
export declare function where<T>(iterable: Iterable<T>, condition: (arg: T) => boolean): Generator<T, void, unknown>;
