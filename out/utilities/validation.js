function throwOnUnexpected(path, expected, actual) {
    let combinedPath = "";
    for (const p of path) {
        if (typeof p == "number") {
            combinedPath += '[' + p.toString() + ']';
        }
        else {
            const s = p.toString();
            if (combinedPath === "") {
                combinedPath = s;
            }
            else {
                combinedPath += "." + s;
            }
        }
    }
    const actualType = actual === null ? 'null' :
        actual instanceof Array ? 'array' :
            typeof actual;
    throw new Error("Expected an " + expected + " on path '" + combinedPath + "' but instead found " + actualType + ".");
}
export function ensureTypeOf(path, obj, prop, type) {
    const val = obj[prop];
    if (typeof val != type) {
        path.push(prop);
        throwOnUnexpected(path, type, val);
    }
}
export function ensureNumber(path, obj, prop) {
    ensureTypeOf(path, obj, prop, 'number');
}
export function ensureInteger(path, obj, prop) {
    const val = obj[prop];
    if (typeof val != "number" || !Number.isInteger(val)) {
        path.push(prop);
        throwOnUnexpected(path, "integer", val);
    }
}
export function ensureIntegerOrString(path, obj, prop) {
    const val = obj[prop];
    if (typeof val == "string") {
        if (Number.isNaN(Number.parseInt(val))) {
            path.push(prop);
            throwOnUnexpected(path, "integer", val);
        }
    }
    else if (typeof val != "number" || !Number.isInteger(val)) {
        path.push(prop);
        throwOnUnexpected(path, "integer", val);
    }
}
export function ensureString(path, obj, prop) {
    ensureTypeOf(path, obj, prop, 'string');
}
export function ensureStringValue(path, obj) {
    if (typeof obj != "string")
        throwOnUnexpected(path, "string", obj);
}
export function ensureOptionalString(path, obj, prop) {
    const val = obj[prop];
    if (val !== null && typeof val !== "undefined" && typeof val !== "string") {
        path.push(prop);
        throwOnUnexpected(path, "string?", val);
    }
}
export function ensureBoolean(path, obj, prop) {
    ensureTypeOf(path, obj, prop, 'boolean');
}
export function ensureArray(path, obj, prop, validate) {
    const val = obj[prop];
    if (!(val instanceof Array)) {
        path.push(prop);
        throwOnUnexpected(path, "array", obj);
    }
    const arr = val;
    path.push(prop);
    for (let x = 0; x < arr.length; ++x) {
        path.push(x);
        validate(path, arr[x]);
        path.pop();
    }
    path.pop();
}
export function ensureArrayObject(path, val, validate) {
    if (!(val instanceof Array)) {
        throwOnUnexpected(path, "array", val);
    }
    const arr = val;
    for (let x = 0; x < arr.length; ++x) {
        path.push(x);
        validate(path, arr[x]);
        path.pop();
    }
}
export function ensureObject(path, val) {
    if (typeof val != 'object' || val == null || val instanceof Array) {
        throwOnUnexpected(path, 'object', val);
    }
}
//# sourceMappingURL=validation.js.map