import { setDataContext, getDataContext } from './data_binding.js';
import { getObjectMonitor } from '../utilities/object_monitoring.js';
import { ArgumetOutOfRangeError, InvalidStateError } from '../utilities/exceptions.js';
import { first, indexOfOrEnd, indexOf } from '../utilities/iterables.js';
import { getTemplateById, getFocusableDescendants, tryGetLoneElement, isFocusWithin, firstFocusableDescendant, firstFocusableDescendantAndSelf } from './dom.js';
function toSpan(text) {
    const span = document.createElement('span');
    span.appendChild(document.createTextNode(text));
    span.tabIndex = 0;
    return span;
}
function createErrorText(err) {
    const text = err instanceof Error ? err.name + ': ' + err.message : 'Unknown error.';
    return document.createTextNode(text);
}
function createErrorElement(err) {
    const span = document.createElement('span');
    span.className = '_error';
    span.appendChild(createErrorText(err));
    return span;
}
var LoadStatus;
(function (LoadStatus) {
    LoadStatus[LoadStatus["NotLoaded"] = 0] = "NotLoaded";
    LoadStatus[LoadStatus["Loaded"] = 1] = "Loaded";
    LoadStatus[LoadStatus["Error"] = 2] = "Error";
})(LoadStatus || (LoadStatus = {}));
export class ListBox extends HTMLElement {
    constructor() {
        super();
        this._isConnected = false;
        this._loadStatus = LoadStatus.NotLoaded;
        this._selectedIndex = -1;
        this._shadow = this.attachShadow({ mode: 'open' });
        this._shadow.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    flex-direction: column;
                    
                    --selection-background: #eaf5ff;
                    --selection-border: #e5f3ff solid 1px;
                    --focus-background: #CCE8FF;
                    --focus-border: #99D1FF solid 1px;
                    --drop-target-border: #FFBD23 solid 1px;
                    
                    --progress-color: #3393DF;
                    --progress-speed: 1s;
                    --error-icon: "\\ea87";
                    --error-icon-font: codicon;
                    --error-icon-color: red;
                    --error-icon-margin: 0.2em;
                }
                :host[hidden] {
                    display: none;
                }
                ._list_box {
                    padding: 0;
                    margin: 0;
                    user-select: none;
                    cursor: default;
                    flex: 1 0 0;
                }
                ._list_box:focus {
                    outline: none;
                }
                ._list_box > * > * {
                    outline: none;
                    border: var(--selection-border);
                    border-color: transparent;
                }
                ._list_box > .selected > * {
                    background-color: var(--selection-background);
                    border: var(--selection-border);
                }
                ._list_box > * > *:focus-within {
                    background-color: var(--focus-background);
                    border: var(--focus-border);
                }
                ._list_box > ._drop_target > * {
                    border: var(--drop-target-border);
                }
                ._list_box._loading::before {
                    display: block;
                    content: '';
                    background-color: var(--progress-color);
                    height: 1px;
                    animation-duration: var(--progress-speed);
                    animation-name: progress_bar;
                    animation-iteration-count: infinite;
                }
                @keyframes progress_bar {
                    from {
                        margin-left: 0%;
                        margin-right: 100%;
                    }
                    50% {
                        margin-left: 0%;
                        margin-right: 0%;
                    }
                    to {
                        margin-left: 100%;
                        margin-right: 0%;
                    }
                }
                ._error::before {
                    content: var(--error-icon);
                    font-family: var(--error-icon-font);
                    color: var(--error-icon-color);
                    margin-right: var(--error-icon-margin);
                }
            </style>
        `;
        this._additionalStyles = document.createElement('div');
        this._shadow.appendChild(this._additionalStyles);
        this._root = document.createElement('div');
        this._root.className = '_list_box';
        this._root.tabIndex = 0;
        this._shadow.appendChild(this._root);
        this._content = new Map();
        this._abortController = new AbortController();
        this._root.addEventListener('keydown', ev => this.onKeyDown(ev));
        this._root.addEventListener('focusin', ev => this.onFocusIn(ev));
        this._root.addEventListener('dblclick', ev => this.onDoubleClick(ev));
        this._root.addEventListener('mousedown', ev => this.onMouseDown(ev));
        this._root.addEventListener('keypress', ev => this.onKeyPress(ev));
        this._root.addEventListener('dragstart', ev => this.onDragStart(ev));
        this._root.addEventListener('dragover', ev => this.onDragOver(ev));
        this._root.addEventListener('dragleave', ev => this.onDragLeave(ev));
        this._root.addEventListener('drop', ev => this.onDrop(ev));
        this._root.addEventListener('dragend', ev => this.onDragEnd(ev));
        this._arrayListener = (target, index, inserted, deleted) => this.onArrayChanged(target, index, inserted, deleted);
    }
    static get observedAttributes() { return ['templateId', 'externalStylesTemplateId']; }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'templateId') {
            if (this._isConnected) {
                this.template = getTemplateById(this, newValue);
            }
            else {
                this.template = undefined;
            }
        }
        else if (name === 'externalStylesTemplateId') {
            this._additionalStyles.innerHTML = '';
            if (this._isConnected) {
                const styleTemplate = getTemplateById(this, newValue);
                if (styleTemplate !== undefined) {
                    this._additionalStyles.appendChild(styleTemplate.content.cloneNode(true));
                }
            }
        }
    }
    connectedCallback() {
        this._isConnected = true;
        const styleTemplate = getTemplateById(this, this.externalStylesTemplateId);
        if (styleTemplate !== undefined) {
            this._additionalStyles.appendChild(styleTemplate.content.cloneNode(true));
        }
        this._template = getTemplateById(this, this.templateId);
        if (this._dataSource !== undefined) {
            this.loadElements(this._dataSource, this._abortController.signal);
        }
    }
    disconnectedCallback() {
        var _a;
        this._isConnected = false;
        this._abortController.abort();
        this._abortController = new AbortController();
        this._additionalStyles.innerHTML = '';
        this._template = undefined;
        this._root.innerHTML = '';
        if (this._observedArray !== undefined) {
            (_a = getObjectMonitor(this._observedArray)) === null || _a === void 0 ? void 0 : _a.removeArrayListener(this._arrayListener);
            this._observedArray = undefined;
        }
        this._loadStatus = LoadStatus.NotLoaded;
    }
    adoptedCallback() {
        this._additionalStyles.innerHTML = '';
        const styleTemplate = getTemplateById(this, this.externalStylesTemplateId);
        if (styleTemplate !== undefined) {
            this._additionalStyles.appendChild(styleTemplate.content.cloneNode(true));
        }
        this.template = getTemplateById(this, this.templateId);
    }
    get dataSource() {
        return this._dataSource;
    }
    set dataSource(ds) {
        var _a;
        if (ds === this._dataSource)
            return;
        if (this._dataSource !== undefined) {
            if (this._observedArray !== undefined) {
                (_a = getObjectMonitor(this._observedArray)) === null || _a === void 0 ? void 0 : _a.removeArrayListener(this._arrayListener);
                this._observedArray = undefined;
            }
            this._abortController.abort();
            this._abortController = new AbortController();
            this._loadStatus = LoadStatus.NotLoaded;
            this._root.innerHTML = '';
            this._selectedIndex = -1;
            this._dataSource = undefined;
        }
        if (ds !== undefined) {
            this._dataSource = ds;
            if (this._isConnected) {
                this.loadElements(ds, this._abortController.signal);
            }
        }
    }
    get templateId() {
        return this.getAttribute('templateId');
    }
    set templateId(id) {
        if (id !== null) {
            this.setAttribute('templateId', id);
        }
        else {
            this.removeAttribute('templateId');
        }
    }
    get externalStylesTemplateId() {
        return this.getAttribute('externalStylesTemplateId');
    }
    set externalStylesTemplateId(id) {
        if (id !== null) {
            this.setAttribute('externalStylesTemplateId', id);
        }
        else {
            this.removeAttribute('externalStylesTemplateId');
        }
    }
    set template(value) {
        if (this._template === value)
            return;
        this._template = value;
        this.updateContent();
    }
    updateContent() {
        for (const item of this._root.children) {
            if (!this._content.has(item))
                continue;
            const contentElement = this.createElement(this._content.get(item));
            item.innerHTML = '';
            item.appendChild(contentElement);
        }
    }
    createElement(content) {
        try {
            const template = this._template;
            if (template !== undefined) {
                const clone = template.content.cloneNode(true);
                const maybeOnlyChild = tryGetLoneElement(clone);
                if (maybeOnlyChild !== undefined) {
                    return maybeOnlyChild;
                }
                else {
                    const div = document.createElement('div');
                    div.appendChild(clone);
                    return div;
                }
            }
            else {
                if (content instanceof HTMLElement) {
                    return content;
                }
                else if (content === undefined) {
                    return toSpan('<undefined>');
                }
                else if (typeof content === 'string') {
                    return toSpan(content);
                }
                else if (typeof content.toString === 'function') {
                    return toSpan(content.toString());
                }
                else {
                    return toSpan(typeof content);
                }
            }
        }
        catch (err) {
            return createErrorElement(err);
        }
    }
    async loadElements(dataSource, signal) {
        var _a, _b;
        this._root.classList.add('_loading');
        try {
            const items = [];
            const elements = await dataSource(signal);
            const draggable = this.hasAttribute('allowreorder') && elements instanceof Array;
            for (const element of elements) {
                const item = document.createElement('div');
                item.appendChild(this.createElement(element));
                this._content.set(item, element);
                setDataContext(item, element);
                if (draggable)
                    item.setAttribute('draggable', 'true');
                items.push(item);
            }
            if (items.length > 0) {
                this._root.append(...items);
                items[0].classList.add('selected');
                this._selectedIndex = 0;
                if (isFocusWithin(this._root)) {
                    (_a = first(getFocusableDescendants(items[0]))) === null || _a === void 0 ? void 0 : _a.focus();
                }
                this._root.tabIndex = -1;
            }
            this._loadStatus = LoadStatus.Loaded;
            if (elements instanceof Array) {
                this._observedArray = elements;
                (_b = getObjectMonitor(elements)) === null || _b === void 0 ? void 0 : _b.addArrayListener(this._arrayListener);
            }
            else {
                this._observedArray = undefined;
            }
        }
        catch (err) {
            if (!signal.aborted) {
                this._root.appendChild(createErrorElement(err));
            }
        }
        this._root.classList.remove('_loading');
    }
    onArrayChanged(target, index, inserted, deleted) {
        var _a, _b, _c;
        const hadFocus = isFocusWithin(this._root);
        const draggable = this.hasAttribute('allowreorder') && this._observedArray !== undefined;
        const replacedNodes = inserted < deleted ? inserted : deleted;
        for (let x = index; x < index + replacedNodes; ++x) {
            const item = this._root.children[x];
            if (this._template === undefined) {
                item.firstChild.replaceWith(this.createElement(target[x]));
            }
            this._content.set(item, target[x]);
            setDataContext(item, target[x]);
            if (this._selectedIndex === x) {
                if (hadFocus) {
                    (_a = firstFocusableDescendant(item)) === null || _a === void 0 ? void 0 : _a.focus();
                }
            }
        }
        index += replacedNodes;
        inserted -= replacedNodes;
        deleted -= replacedNodes;
        if (inserted > 0) {
            const items = [];
            for (let x = 0; x < inserted; ++x) {
                const element = target[index + x];
                const item = document.createElement('div');
                item.appendChild(this.createElement(element));
                this._content.set(item, element);
                setDataContext(item, element);
                if (draggable)
                    item.setAttribute('draggable', 'true');
                items.push(item);
            }
            if (index > 0) {
                this._root.children[index - 1].after(...items);
            }
            else {
                this._root.prepend(...items);
            }
            if (this._selectedIndex >= index) {
                this._selectedIndex += inserted;
            }
            if (this._selectedIndex == -1) {
                items[0].classList.add('selected');
                this._selectedIndex = 0;
                if (hadFocus)
                    (_b = firstFocusableDescendant(items[0])) === null || _b === void 0 ? void 0 : _b.focus();
                this._root.tabIndex = -1;
            }
        }
        else if (deleted > 0) {
            for (let x = 0; x < deleted; ++x) {
                this._root.children[index].remove();
            }
            if (this._selectedIndex >= index && index < this._selectedIndex + deleted) {
                if (this._root.children.length === 0) {
                    this._selectedIndex = -1;
                    this._root.tabIndex = 0;
                    if (hadFocus)
                        this._root.focus();
                }
                else {
                    const idx = this._selectedIndex < this._root.children.length ? this._selectedIndex : this._selectedIndex - 1;
                    this._root.children[idx].classList.add('selected');
                    this._selectedIndex = idx;
                    if (hadFocus)
                        (_c = firstFocusableDescendant(this._root.children[idx])) === null || _c === void 0 ? void 0 : _c.focus();
                }
            }
        }
    }
    findItemInEventPath(ev) {
        for (const x of ev.composedPath()) {
            if (x == this._root)
                break;
            if (x instanceof HTMLDivElement && x.parentElement === this._root)
                return x;
        }
        return undefined;
    }
    getPreviousFocusable(x) {
        while (--x >= 0) {
            const ch = this._root.children[x];
            if (ch instanceof HTMLElement) {
                const focusable = first(getFocusableDescendants(ch));
                if (focusable !== undefined)
                    return focusable;
            }
        }
        return undefined;
    }
    getNextFocusable(index) {
        for (let x = index; x < this._root.children.length; ++x) {
            const ch = this._root.children[x];
            if (ch instanceof HTMLElement) {
                const focusable = first(getFocusableDescendants(ch));
                if (focusable !== undefined)
                    return focusable;
            }
        }
        return undefined;
    }
    onKeyDown(ev) {
        if (this._loadStatus != LoadStatus.Loaded)
            return;
        const key = ev.key;
        if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'Home' && key !== 'End') {
            if (key === 'Delete') {
                const item = this.findItemInEventPath(ev);
                if (item === undefined)
                    return;
                ev.stopPropagation();
                var ctx = getDataContext(item);
                const event = new CustomEvent('list_box_item_delete_requested', { detail: ctx });
                this.dispatchEvent(event);
            }
        }
        else {
            const item = this.findItemInEventPath(ev);
            if (item === undefined)
                return;
            ev.cancelBubble = true;
            ev.preventDefault();
            const itemToFocus = key === 'ArrowUp' ? this.getPreviousFocusable(this.selectedIndex) :
                key === 'ArrowDown' ? this.getNextFocusable(this.selectedIndex + 1) :
                    key === 'Home' ? this.getNextFocusable(0) :
                        key === 'End' ? this.getPreviousFocusable(this._root.children.length) :
                            undefined;
            if (itemToFocus !== undefined) {
                itemToFocus.focus({ preventScroll: true });
                itemToFocus.scrollIntoView({ block: "nearest" });
            }
        }
    }
    onDoubleClick(ev) {
        if (this._loadStatus != LoadStatus.Loaded)
            return;
        for (const el of ev.composedPath()) {
            if (el == this._root)
                break;
            if (el instanceof HTMLDivElement && el.parentElement === this._root) {
                var ctx = getDataContext(el);
                const event = new CustomEvent('list_box_item_confirmed', { detail: ctx });
                this.dispatchEvent(event);
                ev.stopPropagation();
                break;
            }
        }
    }
    onMouseDown(ev) {
        var _a;
        if (this._loadStatus != LoadStatus.Loaded)
            return;
        if (ev.target === this._root && this._selectedIndex >= 0) {
            ev.preventDefault();
            ev.stopPropagation();
            (_a = first(getFocusableDescendants(this._root.children[this._selectedIndex]))) === null || _a === void 0 ? void 0 : _a.focus();
        }
    }
    onKeyPress(ev) {
        if (this._loadStatus != LoadStatus.Loaded)
            return;
        if (ev.key === 'Enter') {
            const item = this.findItemInEventPath(ev);
            if (item === undefined)
                return;
            ev.stopPropagation();
            var ctx = getDataContext(item);
            const event = new CustomEvent('list_box_item_confirmed', { detail: ctx });
            this.dispatchEvent(event);
        }
    }
    itemFromElement(el) {
        while (el !== this) {
            const parent = el.parentElement;
            if (parent === null)
                return undefined;
            if (parent === this._root)
                return el;
            el = parent;
        }
        return undefined;
    }
    onDragStart(ev) {
        if (!(ev.target instanceof HTMLElement))
            return;
        const item = ev.target;
        let idx = indexOf(this._root.children, item);
        if (idx < 0)
            return;
        ev.stopPropagation();
        this._draggedElementIndex = idx;
        ev.dataTransfer.dropEffect = 'move';
    }
    onDragOver(ev) {
        var _a;
        if (this._draggedElementIndex === undefined || !(ev.target instanceof HTMLElement))
            return;
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'move';
        const item = (_a = this.itemFromElement(ev.target), (_a !== null && _a !== void 0 ? _a : this._root.lastElementChild));
        if (item !== this._dropTarget) {
            if (this._dropTarget !== undefined) {
                this._dropTarget.classList.remove('_drop_target');
            }
            this._dropTarget = item;
            if (this._dropTarget !== undefined) {
                this._dropTarget.classList.add('_drop_target');
            }
        }
    }
    onDragLeave(ev) {
        if (this._draggedElementIndex === undefined || !(ev.target instanceof HTMLElement))
            return;
        ev.preventDefault();
        ev.stopPropagation();
        if (this._dropTarget !== undefined) {
            this._dropTarget.classList.remove('_drop_target');
            this._dropTarget = undefined;
        }
    }
    onDrop(ev) {
        var _a;
        if (this._draggedElementIndex === undefined || !(ev.target instanceof HTMLElement))
            return;
        ev.preventDefault();
        ev.stopPropagation();
        if (this._dropTarget !== undefined) {
            this._dropTarget.classList.remove('_drop_target');
            this._dropTarget = undefined;
        }
        const item = this.itemFromElement(ev.target);
        let dropIdx = item !== undefined ? indexOfOrEnd(this._root.children, item) : this._observedArray.length - 1;
        if (dropIdx !== this._draggedElementIndex) {
            const val = this._observedArray[this._draggedElementIndex];
            this._observedArray.splice(this._draggedElementIndex, 1);
            this._observedArray.splice(dropIdx, 0, val);
            (_a = first(getFocusableDescendants(this._root.children[dropIdx]))) === null || _a === void 0 ? void 0 : _a.focus();
        }
    }
    onDragEnd(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this._draggedElementIndex = undefined;
    }
    onFocusIn(ev) {
        if (this._loadStatus != LoadStatus.Loaded)
            return;
        for (const el of ev.composedPath()) {
            if (el == this._root)
                break;
            if (el instanceof HTMLDivElement && el.parentElement === this._root) {
                const selectedItem = this._selectedIndex >= 0 ? this._root.children[this._selectedIndex] : undefined;
                if (selectedItem !== el) {
                    if (selectedItem !== undefined) {
                        selectedItem.classList.remove('selected');
                    }
                    this._selectedIndex = -1;
                    for (let x = 0; x < this._root.children.length; ++x) {
                        if (this._root.children[x] === el) {
                            this._selectedIndex = x;
                            el.classList.add('selected');
                            break;
                        }
                    }
                }
                break;
            }
        }
    }
    get selectedIndex() {
        return this._selectedIndex;
    }
    set selectedIndex(index) {
        var _a;
        if (this._loadStatus !== LoadStatus.Loaded)
            throw new InvalidStateError('Items not loaded.');
        if (!Number.isInteger(index) || index < -1 || index >= this._root.children.length) {
            throw new ArgumetOutOfRangeError('Index must be an integer between -1 and number of items.');
        }
        if (this._selectedIndex === index)
            return;
        var hadFocus = isFocusWithin(this._root);
        if (this._selectedIndex >= 0) {
            this._root.children[this._selectedIndex].classList.remove('selected');
        }
        this._selectedIndex = index;
        if (this._selectedIndex >= 0) {
            const child = this._root.children[this._selectedIndex];
            this._root.children[this._selectedIndex].classList.add('selected');
            this._root.children[this._selectedIndex].scrollIntoView({ block: 'nearest' });
            if (hadFocus) {
                (_a = first(getFocusableDescendants(child))) === null || _a === void 0 ? void 0 : _a.focus();
            }
        }
    }
    get itemCount() {
        if (this._loadStatus === LoadStatus.Loaded) {
            return this._root.children.length;
        }
        else {
            return 0;
        }
    }
    getItem(index) {
        if (!Number.isInteger(index) || index < 0 || index >= this.itemCount) {
            throw new ArgumetOutOfRangeError('Index must be an integer between 0 and number of items.');
        }
        return getDataContext(this._root.children[index]);
    }
    focus() {
        var _a;
        if (isFocusWithin(this._root))
            return;
        if (this.selectedIndex >= 0) {
            (_a = firstFocusableDescendantAndSelf(this._root.children[this.selectedIndex])) === null || _a === void 0 ? void 0 : _a.focus();
        }
        else {
            this._root.focus();
        }
    }
}
customElements.define('list-box', ListBox);
//# sourceMappingURL=list_box.js.map