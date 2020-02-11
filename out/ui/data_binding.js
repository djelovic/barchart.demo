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
            updateDataContextRecursively(ch, context);
        }
    }
    else {
        for (const ch of el.children) {
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
    evaluate() {
        var _a;
        const binding = this.binding;
        if (binding === null) {
            return '';
        }
        else {
            try {
                let result = function (str) {
                    return eval(str);
                }.call(this.dataContext, binding);
                if (result === undefined) {
                    return '<undefined>';
                }
                else if (typeof result == 'string') {
                    return result;
                }
                else if (typeof result.toString === 'function') {
                    return result.toString();
                }
                else {
                    return _a = typeof result, (_a !== null && _a !== void 0 ? _a : '<unknown>');
                }
            }
            catch (err) {
                return '<error>';
            }
        }
    }
}
customElements.define('text-binding', TextBinding);
//# sourceMappingURL=data_binding.js.map