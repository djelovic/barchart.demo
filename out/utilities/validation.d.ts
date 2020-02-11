export declare function ensureTypeOf<T, K extends keyof T>(path: (string | number | symbol)[], obj: T, prop: K, type: "string" | "number" | "bigint" | "boolean" | "undefined" | "object"): void;
export declare type PropertiesOfType<T, PropType> = {
    [K in keyof T]: T[K] extends PropType ? K : never;
}[keyof T];
export declare function ensureNumber<T, K extends PropertiesOfType<T, number>>(path: (string | number | symbol)[], obj: T, prop: K): void;
export declare function ensureInteger<T, K extends PropertiesOfType<T, number>>(path: (string | number | symbol)[], obj: T, prop: K): void;
export declare function ensureIntegerOrString<T, K extends PropertiesOfType<T, number | string>>(path: (string | number | symbol)[], obj: T, prop: K): void;
export declare function ensureString<T, K extends PropertiesOfType<T, string>>(path: (string | number | symbol)[], obj: T, prop: K): void;
export declare function ensureStringValue(path: (string | number | symbol)[], obj: string): void;
export declare function ensureOptionalString<T, K extends PropertiesOfType<T, string | null | undefined>>(path: (string | number | symbol)[], obj: T, prop: K): void;
export declare function ensureBoolean<T, K extends PropertiesOfType<T, boolean>>(path: (string | number | symbol)[], obj: T, prop: K): void;
export declare function ensureArray<T, E, K extends PropertiesOfType<T, ReadonlyArray<E>>>(path: (string | number | symbol)[], obj: T, prop: K, validate: (path: (string | number | symbol)[], x: any) => void): void;
export declare function ensureArrayObject<E>(path: (string | number | symbol)[], val: any, validate: (path: (string | number | symbol)[], x: any) => void): asserts val is E[];
export declare function ensureObject(path: (string | number | symbol)[], val: object): void;
