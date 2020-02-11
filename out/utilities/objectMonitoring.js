const _objectsToHandlers = new WeakMap();
class Handler {
    set(target, p, value, receiver) {
        target[p] = value;
        return true;
    }
}
export function getObjectMonitor(obj) {
    return _objectsToHandlers.get(obj);
}
export function toMonitoredObject(obj) {
    const handler = new Handler();
    const proxy = new Proxy(obj, handler);
    _objectsToHandlers.set(proxy, handler);
    return proxy;
}
//# sourceMappingURL=objectMonitoring.js.map