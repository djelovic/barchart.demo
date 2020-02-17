const _objectsToHandlers = new WeakMap();
class ObjectObserverImpl {
    addPropertyChangedListener(listener) {
        if (this._propertyChangedListeners === undefined)
            this._propertyChangedListeners = [];
        this._propertyChangedListeners.push(listener);
    }
    removePropertyChangedListener(listener) {
        if (this._propertyChangedListeners === undefined)
            return;
        const idx = this._propertyChangedListeners.indexOf(listener);
        if (idx >= 0) {
            this._propertyChangedListeners.splice(idx, 1);
        }
    }
    set(target, p, value, receiver) {
        target[p] = value;
        if (this._propertyChangedListeners !== undefined) {
            for (const listener of this._propertyChangedListeners) {
                if (typeof listener === 'function') {
                    listener(target, p);
                }
                else {
                    listener.propertyChangedCallback(target, p);
                }
            }
        }
        return true;
    }
}
class ArrayObserverImpl {
    constructor(target) {
        this._target = target;
    }
    addArrayListener(listener) {
        if (this._arrayListeners === undefined)
            this._arrayListeners = [];
        this._arrayListeners.push(listener);
    }
    removeArrayListener(listener) {
        if (this._arrayListeners === undefined)
            return;
        const idx = this._arrayListeners.indexOf(listener);
        if (idx >= 0) {
            this._arrayListeners.splice(idx, 1);
        }
    }
    set(target, p, value, receiver) {
        target[p] = value;
        if (typeof p === 'number') {
            this.notifyListeners(p, 1, 1);
        }
        else if (typeof p === 'string') {
            const idx = parseInt(p);
            if (!isNaN(idx) && idx >= 0) {
                this.notifyListeners(idx, 1, 1);
            }
        }
        return true;
    }
    get(target, p, receiver) {
        if (p === 'push')
            return this.push;
        else if (p === 'pop')
            return this.pop;
        else if (p === 'shift')
            return this.shift;
        else if (p === 'unshift')
            return this.unshift;
        else if (p === 'splice')
            return this.splice;
        else
            return target[p];
    }
    notifyListeners(index, inserted, deleted) {
        if (this._arrayListeners === undefined)
            return;
        for (const listener of this._arrayListeners) {
            if (typeof listener === 'function') {
                listener(this._target, index, inserted, deleted);
            }
            else {
                listener.arrayChangedCallback(this._target, index, inserted, deleted);
            }
        }
    }
    push(...items) {
        const self = _objectsToHandlers.get(this);
        const len = self._target.length;
        const ret = self._target.push(...items);
        self.notifyListeners(len, items.length, 0);
        return ret;
    }
    pop() {
        const self = _objectsToHandlers.get(this);
        const len = self._target.length;
        if (len == 0)
            return undefined;
        const ret = self._target.pop();
        self.notifyListeners(len - 1, 0, 1);
        return ret;
    }
    shift() {
        const self = _objectsToHandlers.get(this);
        if (self._target.length == 0)
            return undefined;
        const ret = self._target.shift();
        self.notifyListeners(0, 0, 1);
        return ret;
    }
    unshift(...items) {
        const self = _objectsToHandlers.get(this);
        const ret = self._target.unshift(...items);
        self.notifyListeners(0, items.length, 0);
        return ret;
    }
    splice(start, deleteCount, items) {
        const self = _objectsToHandlers.get(this);
        if (deleteCount === undefined)
            deleteCount = self._target.length - start;
        else if (deleteCount + start > self._target.length)
            deleteCount = self._target.length - start;
        if (items !== undefined) {
            const ret = items instanceof Array ?
                self._target.splice(start, deleteCount, ...items) :
                self._target.splice(start, deleteCount, items);
            self.notifyListeners(start, items instanceof Array ? items.length : 1, deleteCount);
            return ret;
        }
        else {
            const ret = self._target.splice(start, deleteCount);
            self.notifyListeners(start, 0, deleteCount);
            return ret;
        }
    }
}
export function getObjectMonitor(obj) {
    return _objectsToHandlers.get(obj);
}
export function toMonitoredObject(obj) {
    const handler = Array.isArray(obj) ? new ArrayObserverImpl(obj) : new ObjectObserverImpl();
    const proxy = new Proxy(obj, handler);
    _objectsToHandlers.set(proxy, handler);
    return proxy;
}
class ObjectAccessObserver {
    constructor(tracked) {
        this._toProxy = new Map();
        this._tracked = tracked;
    }
    getAccessProxy(obj) {
        let proxy = this._toProxy.get(obj);
        if (proxy === undefined) {
            proxy = new Proxy(obj, this);
            this._toProxy.set(obj, proxy);
        }
        return proxy;
    }
    get(target, p, receiver) {
        if (getObjectMonitor(target) !== undefined) {
            if (this._tracked.indexOf(target) < 0) {
                this._tracked.push(target);
            }
        }
        const ret = target[p];
        if (typeof ret === 'object') {
            return this.getAccessProxy(ret);
        }
        else {
            return ret;
        }
    }
    evaluate(thisArg, s) {
        const proxyThis = this.getAccessProxy(thisArg);
        const f = function (str) {
            return eval(str);
        };
        return f.call(proxyThis, s);
    }
}
const fastPathRegEx = /^this(\.[a-zA-Z\$][a-zA-Z0\$0-9]*)*$/;
function evaluateAndGetDependenciesSimple(thisArg, s, outDependencies) {
    let dotPos = 4;
    while (dotPos < s.length) {
        const nextDot = s.indexOf('.', dotPos + 1);
        const property = s.slice(dotPos + 1, nextDot >= 0 ? nextDot : s.length);
        if (thisArg instanceof Object) {
            if (getObjectMonitor(thisArg) !== undefined) {
                if (outDependencies.indexOf(thisArg) < 0) {
                    outDependencies.push(thisArg);
                }
            }
        }
        thisArg = thisArg[property];
        dotPos = nextDot >= 0 ? nextDot : s.length;
    }
    return thisArg;
}
export function evaluateAndGetDependencies(thisArg, s, outDependencies) {
    outDependencies.splice(0, outDependencies.length);
    if (fastPathRegEx.test(s)) {
        return evaluateAndGetDependenciesSimple(thisArg, s, outDependencies);
    }
    else if (typeof thisArg === 'object') {
        const oas = new ObjectAccessObserver(outDependencies);
        return oas.evaluate(thisArg, s);
    }
    else {
        const f = function (str) {
            return eval(str);
        };
        return f.call(thisArg, s);
    }
}
//# sourceMappingURL=object_monitoring.js.map