export function getPreviousElement(iterable, element) {
    let previous = undefined;
    for (const a of iterable) {
        if (a === element) {
            return previous;
        }
        previous = a;
    }
    return undefined;
}
export function getNextElement(iterable, element) {
    let found = false;
    for (const a of iterable) {
        if (found)
            return a;
        else if (a === element) {
            found = true;
        }
    }
    return undefined;
}
export function first(iterable, condition) {
    if (condition === undefined) {
        for (const a of iterable)
            return a;
    }
    else {
        for (const a of iterable) {
            if (condition(a))
                return a;
        }
    }
    return undefined;
}
export function last(iterable, condition) {
    let x = undefined;
    if (condition === undefined) {
        for (const a of iterable)
            x = a;
    }
    else {
        for (const a of iterable) {
            if (condition(a))
                x = a;
        }
    }
    return x;
}
export function indexOf(iterable, val) {
    let index = 0;
    for (const a of iterable) {
        if (a === val)
            return index;
        ++index;
    }
    return -1;
}
export function indexOfOrEnd(iterable, val) {
    let index = 0;
    for (const a of iterable) {
        if (a === val)
            return index;
        ++index;
    }
    return index;
}
export function* where(iterable, condition) {
    for (const a of iterable) {
        if (condition(a))
            yield a;
    }
}
//# sourceMappingURL=iterables.js.map