export class ArgumentError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ArgumentError';
    }
}
export class ArgumetOutOfRangeError extends ArgumentError {
    constructor(message) {
        super(message);
        this.name = 'ArgumentOutOfRangeError';
    }
}
export function ensureInteger(name, value) {
    if (!Number.isInteger(value)) {
        throw new ArgumentError(name + ' is not an integer.');
    }
}
export class InvalidStateError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidStateError';
    }
}
//# sourceMappingURL=exceptions.js.map