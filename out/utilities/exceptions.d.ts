export declare class ArgumentError extends Error {
    constructor(message: string);
}
export declare class ArgumetOutOfRangeError extends ArgumentError {
    constructor(message: string);
}
export declare function ensureInteger(name: string, value: number): void;
export declare class InvalidStateError extends Error {
    constructor(message: string);
}
