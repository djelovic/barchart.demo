import { evaluateAndGetDependencies, getObjectMonitor } from '../utilities/object_monitoring.js';
import { post, cancelPost } from './event_queue.js';
const _dataContexts = new WeakMap();
function updateDataContextRecursively(el, context) {
    if (_dataContexts.get(el) !== undefined)
        return;
    if ('dataContext' in el) {
        el.dataContext = context;
    }
    updateChildrenDataContextRecursively(el, context);
}
function updateChildrenDataContextRecursively(el, context) {
    if (el.shadowRoot !== null) {
        for (const ch of el.shadowRoot.children) {
            if (ch instanceof HTMLElement)
                updateDataContextRecursively(ch, context);
        }
    }
    else {
        for (const ch of el.children) {
            if (ch instanceof HTMLElement)
                updateDataContextRecursively(ch, context);
        }
    }
}
export function setDataContext(el, context) {
    if (context !== undefined) {
        _dataContexts.set(el, context);
    }
    else {
        _dataContexts.delete(el);
    }
    if ('dataContext' in el) {
        el.dataContext = context;
    }
    updateChildrenDataContextRecursively(el, context);
}
export function getDataContext(el) {
    while (el != null) {
        const context = _dataContexts.get(el);
        if (context !== undefined)
            return context;
        el = el.parentElement;
    }
    return undefined;
}
export function getDataContextDirect(el) {
    return _dataContexts.get(el);
}
/// class TextBinding
export class TextBinding extends HTMLElement {
    constructor() {
        super();
        this._dataContext = undefined;
        this._dirty = false;
        this._shadow = this.attachShadow({ mode: 'open' });
    }
    static get observedAttributes() { return ['binding']; }
    get binding() {
        return this.getAttribute('binding');
    }
    set binding(value) {
        if (value !== null) {
            this.setAttribute('binding', value);
        }
        else {
            this.removeAttribute('binding');
        }
    }
    get dataContext() {
        return this._dataContext;
    }
    set dataContext(value) {
        if (this._dataContext === value)
            return;
        this._dataContext = value;
        if (this._text !== undefined) {
            this._text.nodeValue = this.evaluate();
        }
    }
    connectedCallback() {
        this._dataContext = getDataContext(this);
        this._text = document.createTextNode('');
        this._text.nodeValue = this.evaluate();
        this._shadow.appendChild(this._text);
    }
    disconnectedCallback() {
        this._shadow.innerHTML = '';
        this._text = undefined;
        this.dataContext = undefined;
        this.unsubscribeFromDependencies();
        this._dirty = false;
        if (this._postId !== undefined) {
            cancelPost(this._postId);
            this._postId = undefined;
        }
    }
    adoptedCallback() {
        this._dataContext = getDataContext(this);
        this._text.nodeValue = this.evaluate();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name == 'binding') {
            if (this._text !== undefined) {
                this._text.nodeValue = this.evaluate();
            }
        }
    }
    unsubscribeFromDependencies() {
        if (this._dependsOn !== undefined) {
            for (const a of this._dependsOn) {
                if (a instanceof Array) {
                    const monitor = getObjectMonitor(a);
                    monitor.removeArrayListener(this);
                }
                else {
                    const monitor = getObjectMonitor(a);
                    monitor.removePropertyChangedListener(this);
                }
            }
            this._dependsOn.splice(0, this._dependsOn.length);
        }
    }
    evaluate() {
        var _a;
        this.unsubscribeFromDependencies();
        this._dirty = false;
        if (this._postId !== undefined) {
            cancelPost(this._postId);
            this._postId = undefined;
        }
        const binding = this.binding;
        if (binding === null) {
            return '';
        }
        else {
            if (this._dependsOn === undefined)
                this._dependsOn = [];
            let ret;
            try {
                const result = evaluateAndGetDependencies(this.dataContext, binding, this._dependsOn);
                if (result === undefined) {
                    ret = '<undefined>';
                }
                else if (typeof result == 'string') {
                    ret = result;
                }
                else if (typeof result.toString === 'function') {
                    ret = result.toString();
                }
                else {
                    ret = (_a = typeof result, (_a !== null && _a !== void 0 ? _a : '<unknown>'));
                }
            }
            catch (err) {
                ret = '<error>';
            }
            if (this._dependsOn.length > 0) {
                for (const a of this._dependsOn) {
                    if (a instanceof Array) {
                        const monitor = getObjectMonitor(a);
                        monitor.addArrayListener(this);
                    }
                    else {
                        const monitor = getObjectMonitor(a);
                        monitor.addPropertyChangedListener(this);
                    }
                }
            }
            return ret;
        }
    }
    arrayChangedCallback(target, index, inserted, deleted) {
        this.onDependencyChanged();
    }
    propertyChangedCallback(target, property) {
        this.onDependencyChanged();
    }
    onDependencyChanged() {
        if (this._dirty)
            return;
        this._dirty = true;
        this._postId = post(this);
    }
    postCallback() {
        this._dirty = false;
        if (this._text !== undefined) { // this should always be the case, I'm just paranoid
            this._text.nodeValue = this.evaluate();
        }
    }
}
customElements.define('text-binding', TextBinding);
//# sourceMappingURL=data_binding.js.map