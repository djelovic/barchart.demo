import { setDataContext, getDataContext } from './data_binding.js';
import { first, getNextElement, getPreviousElement } from '../utilities/iterables.js';
import { getTemplateById, getFocusableDescendants, getFocusableChildrenInReverse, isFocusWithin, tryGetLoneElement, focusAndScrollIntoView, isDescendantOrSelf, getFocusedElement, firstFocusableDescendantAndSelf } from './dom.js';
function toSpan(text, tabIndex) {
    const span = document.createElement('span');
    span.appendChild(document.createTextNode(text));
    if (tabIndex !== undefined)
        span.tabIndex = tabIndex;
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
function getFocusableContent(branch) {
    return first(getFocusableDescendants(branch));
}
export class TreeControl extends HTMLElement {
    constructor() {
        super();
        this._isConnected = false;
        this._shadow = this.attachShadow({ mode: 'open' });
        this._shadow.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    flex-direction: column;

                    --chevron-width: 1em;
                    --selection-background: #eaf5ff;
                    --selection-border: #e5f3ff solid 1px;
                    --focus-background: #CCE8FF;
                    --focus-border: #99D1FF solid 1px;
                    --progress-color: #3393DF;
                    --progress-speed: 1s;
                    --chevron-font: codicon;
                    --chevron-open: "\\eab4";
                    --chevron-closed: "\\eab6";
                    --chevron-padding: 0px;
                    --error-icon: "\\ea87";
                    --error-icon-font: codicon;
                    --error-icon-color: red;
                    --error-icon-margin: 0em 0.2em 0em 0em;
                    --padding: 0px;
                }
                :host[hidden] {
                    display: none;
                }
                .tree_panel {
                    display: grid;
                    grid-template-columns: var(--chevron-width) 1fr;
                    padding: 0;
                    margin: 0;
                    user-select: none;
                    cursor: default;
                    justify-items: start;
                }
                :host > .tree_panel {
                    padding: var(--padding);
                    flex: 1 0 0;
                }
                :host > ._loading {
                    padding: 0px;
                    flex: 1 0 0;
                }
                :host > .tree_panel:focus {
                    outline: none;
                }
                ._branch {
                    display: contents;
                }
                ._branch::before {
                    font-family: var(--chevron-font);
                    grid-column: 1;
                    padding: var(--chevron-padding);
                }
                ._branch._open::before {
                    content: var(--chevron-open);
                }
                ._branch._closed::before{
                    content: var(--chevron-closed);
                }
                ._branch > * {
                    grid-column: 2;
                }
                ._branch > .tree_panel {
                    display: none;
                }
                ._open > .tree_panel {
                    display: grid;
                }
                ._branch > :first-child {
                    outline: none;
                    border: var(--selection-border);
                    border-color: transparent;
                }
                ._branch.selected > :first-child  {
                    background-color: var(--selection-background);
                    border: var(--selection-border);
                }
                ._branch > :first-child:focus-within {
                    background-color: var(--focus-background);
                    border: var(--focus-border);
                }
                .tree_panel > ._loading > :first-child::after,
                .tree_panel._loading::before {
                    display: block;
                    content: '';
                    background-color: var(--progress-color);
                    height: 1px;
                    animation-duration: var(--progress-speed);
                    animation-name: progress_bar;
                    animation-iteration-count: infinite;
                }
                .tree_panel._loading::before {
                    grid-column: 1 / span 2;
                    justify-self: stretch;
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
                    margin: var(--error-icon-margin);
                }
            </style>
        `;
        this._additionalStyles = document.createElement('div');
        this._shadow.appendChild(this._additionalStyles);
        this._root = document.createElement('div');
        this._root.className = 'tree_panel';
        this._root.tabIndex = 0;
        this._shadow.appendChild(this._root);
        this._abortControllers = new Map();
        this._sources = new Map();
        this._content = new Map();
        this._root.addEventListener('mousedown', ev => this.onMouseDown(ev));
        this._root.addEventListener('click', ev => this.onClick(ev));
        this._root.addEventListener('dblclick', ev => this.onDoubleClick(ev));
        this._root.addEventListener('keydown', ev => this.onKeyDown(ev));
        this._root.addEventListener('keypress', ev => this.onKeyPress(ev));
        this._root.addEventListener('focusin', ev => this.onFocusIn(ev));
    }
    static get observedAttributes() { return ['branchTemplateId', 'leafTemplateId', 'externalStylesTemplateId']; }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'branchtemplateid') {
            if (this._isConnected) {
                this._branchTemplate = getTemplateById(this, newValue);
                this.updateContentRecursively(this._root);
            }
            else {
                this.branchTemplate = undefined;
            }
        }
        else if (name === 'leaftemplateid') {
            if (this._isConnected) {
                this._leafTemplate = getTemplateById(this, newValue);
                this.updateContentRecursively(this._root);
            }
            else {
                this.leafTemplate = undefined;
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
    closeBranch(branchDiv) {
        branchDiv.classList.replace('_open', '_closed');
        const treePanel = branchDiv.lastChild;
        const ac = this._abortControllers.get(treePanel);
        if (ac !== undefined) {
            ac.abort();
            this._abortControllers.delete(treePanel);
        }
    }
    openBranch(branchDiv) {
        branchDiv.classList.replace('_closed', '_open');
        const treePanel = branchDiv.lastChild;
        const src = this._sources.get(treePanel);
        if (src !== undefined) {
            this.fetchBranch(treePanel, branchDiv, src, false);
        }
    }
    onMouseDown(ev) {
        var _a;
        if (ev.target instanceof HTMLElement && ev.target.classList.contains('_branch')) {
            ev.preventDefault();
        }
        else if (ev.target instanceof HTMLElement && ev.target.classList.contains('tree_panel')) {
            ev.preventDefault();
            ev.stopPropagation();
            if (this._selectedBranch !== undefined) {
                (_a = firstFocusableDescendantAndSelf(this._selectedBranch.firstChild)) === null || _a === void 0 ? void 0 : _a.focus();
            }
            else {
                this._root.focus();
            }
        }
    }
    onClick(ev) {
        var _a;
        const target = ev.target;
        if (target instanceof HTMLDivElement && target.classList.contains('_branch')) {
            if (target.classList.contains('_open')) {
                const hadFocus = isDescendantOrSelf(getFocusedElement(), target);
                const hadSelection = this._selectedBranch !== undefined ? isDescendantOrSelf(this._selectedBranch, target) : false;
                ev.stopPropagation();
                this.closeBranch(target);
                if (hadFocus) {
                    const firstFocusable = target.firstElementChild instanceof HTMLElement ? firstFocusableDescendantAndSelf(target.firstElementChild) : undefined;
                    (_a = firstFocusable) === null || _a === void 0 ? void 0 : _a.focus();
                }
                else if (hadSelection) {
                    this._selectedBranch.classList.remove('selected');
                    this._selectedBranch = target;
                    this._selectedBranch.classList.add('selected');
                }
            }
            else if (target.classList.contains('_closed')) {
                ev.stopPropagation();
                this.openBranch(target);
            }
        }
    }
    onDoubleClick(ev) {
        for (const el of ev.composedPath()) {
            if (el == this)
                break;
            if (el instanceof HTMLDivElement && el.classList.contains('_branch')) {
                const classList = el.classList;
                if (classList.contains('_open')) {
                    this.closeBranch(el);
                }
                else if (classList.contains('_closed')) {
                    this.openBranch(el);
                }
                else {
                    const ctx = getDataContext(el);
                    const event = new CustomEvent('tree_leaf_confirmed', { detail: ctx });
                    this.dispatchEvent(event);
                }
                ev.stopPropagation();
                break;
            }
        }
    }
    onKeyDown(ev) {
        const key = ev.key;
        if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'Home' && key !== 'End')
            return;
        ev.stopPropagation();
        const path = ev.composedPath();
        for (let pos = 0; pos < path.length; ++pos) {
            const el = path[pos];
            if (el instanceof HTMLDivElement && el.classList.contains('_branch')) {
                if (key === 'ArrowLeft') {
                    if (el.classList.contains('_open')) {
                        this.closeBranch(el);
                        const content = getFocusableContent(el);
                        if (content != undefined) {
                            focusAndScrollIntoView(content);
                        }
                    }
                    else {
                        while (++pos < path.length) {
                            const el = path[pos];
                            if (el instanceof HTMLDivElement && el.classList.contains('_branch')) {
                                const up = first(getFocusableDescendants(el));
                                if (up !== undefined) {
                                    focusAndScrollIntoView(up);
                                    break;
                                }
                            }
                        }
                    }
                }
                else if (key === 'ArrowRight' && el.classList.contains('_closed')) {
                    this.openBranch(el);
                }
                else if (key === 'ArrowUp') {
                    const prev = getPreviousElement(getFocusableDescendants(this._root), ev.target);
                    if (prev !== undefined) {
                        focusAndScrollIntoView(prev);
                        ev.stopPropagation();
                        ev.preventDefault();
                    }
                }
                else if (key === 'ArrowDown') {
                    const next = getNextElement(getFocusableDescendants(this._root), ev.target);
                    if (next !== undefined) {
                        focusAndScrollIntoView(next);
                        ev.stopPropagation();
                        ev.preventDefault();
                    }
                }
                else if (key == 'Home') {
                    const x = first(getFocusableDescendants(this._root));
                    if (x !== undefined)
                        focusAndScrollIntoView(x);
                    ev.stopPropagation();
                    ev.preventDefault();
                }
                else if (key == 'End') {
                    const x = first(getFocusableChildrenInReverse(this._root));
                    if (x !== undefined)
                        focusAndScrollIntoView(x);
                    ev.stopPropagation();
                    ev.preventDefault();
                }
                break;
            }
        }
    }
    onKeyPress(ev) {
        if (ev.key !== 'Enter')
            return;
        ev.stopPropagation();
        const path = ev.composedPath();
        for (let pos = 0; pos < path.length; ++pos) {
            const el = path[pos];
            if (el instanceof HTMLDivElement && el.classList.contains('_branch') && !el.classList.contains('_open') && !el.classList.contains('_closed')) {
                const ctx = getDataContext(el);
                const event = new CustomEvent('tree_leaf_confirmed', { detail: ctx });
                this.dispatchEvent(event);
                break;
            }
        }
    }
    terminateAllActions() {
        for (const ac of this._abortControllers.values()) {
            ac.abort();
        }
        this._abortControllers.clear();
    }
    connectedCallback() {
        this._isConnected = true;
        this._additionalStyles.innerHTML = '';
        const styleTemplate = getTemplateById(this, this.externalStylesTemplateId);
        if (styleTemplate !== undefined) {
            this._additionalStyles.appendChild(styleTemplate.content.cloneNode(true));
        }
        this._branchTemplate = getTemplateById(this, this.branchTemplateId);
        this._leafTemplate = getTemplateById(this, this.leafTemplateId);
        const ds = this._sources.get(this._root);
        if (this._isConnected && ds !== undefined) {
            this.fetchBranch(this._root, this._root, ds, true);
        }
    }
    disconnectedCallback() {
        this._isConnected = false;
        this.terminateAllActions();
        this._root.innerHTML = '';
        this._selectedBranch = undefined;
        this._additionalStyles.innerHTML = '';
        this._branchTemplate = undefined;
        this._leafTemplate = undefined;
        this._content.clear();
        const ds = this._sources.get(this._root);
        this._sources.clear();
        if (ds !== undefined) {
            this._sources.set(this._root, ds);
        }
    }
    adoptedCallback() {
        this._additionalStyles.innerHTML = '';
        const styleTemplate = getTemplateById(this, this.externalStylesTemplateId);
        if (styleTemplate !== undefined) {
            this._additionalStyles.appendChild(styleTemplate.content.cloneNode(true));
        }
        const branchTemplate = getTemplateById(this, this.branchTemplateId);
        const leafTemplate = getTemplateById(this, this.leafTemplateId);
        if (branchTemplate !== this._branchTemplate || leafTemplate !== this._leafTemplate) {
            this.branchTemplate = branchTemplate;
            this.leafTemplate = leafTemplate;
            this.updateContentRecursively(this._root);
        }
    }
    get dataSource() {
        return this._sources.get(this._root);
    }
    set dataSource(ds) {
        if (ds === this._sources.get(this._root))
            return;
        const hadFocus = isFocusWithin(this._root);
        if (this._sources.get(this._root) !== undefined) {
            this.terminateAllActions();
            this._root.innerHTML = '';
            this._selectedBranch = undefined;
            this._sources.clear();
            this._root.tabIndex = 0;
            if (hadFocus)
                this._root.focus();
        }
        if (ds !== undefined) {
            this._sources.set(this._root, ds);
            if (this._isConnected && ds !== undefined) {
                this.fetchBranch(this._root, this._root, ds, true);
            }
        }
    }
    get branchTemplateId() {
        return this.getAttribute('branchTemplateId');
    }
    set branchTemplateId(id) {
        if (id !== null) {
            this.setAttribute('branchTemplateId', id);
        }
        else {
            this.removeAttribute('branchTemplateId');
        }
    }
    get leafTemplateId() {
        return this.getAttribute('leafTemplateId');
    }
    set leafTemplateId(id) {
        if (id !== null) {
            this.setAttribute('leafTemplateId', id);
        }
        else {
            this.removeAttribute('leafTemplateId');
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
    set branchTemplate(value) {
        if (this._branchTemplate === value)
            return;
        this._branchTemplate = value;
        this.updateContentRecursively(this._root);
    }
    set leafTemplate(value) {
        if (this._leafTemplate === value)
            return;
        this._leafTemplate = value;
        this.updateContentRecursively(this._root);
    }
    updateContentRecursively(panel) {
        for (const branch of panel.children) {
            if (!this._content.has(branch))
                continue;
            const isBranch = branch.classList.contains('_open') || branch.classList.contains('_closed');
            const contentElement = this.createElement(this._content.get(branch), isBranch);
            branch.replaceChild(contentElement, branch.firstElementChild);
            if (isBranch) {
                this.updateContentRecursively(branch.children[1]);
            }
        }
    }
    get toElement() {
        return this._toElement;
    }
    set toElement(func) {
        if (this._toElement === func)
            return;
        this._toElement = func;
        this.updateContentRecursively(this._root);
    }
    createElement(content, isBranch) {
        try {
            const template = isBranch ? this._branchTemplate : this._leafTemplate;
            if (this._toElement !== undefined) {
                return this._toElement(content);
            }
            else if (template !== undefined) {
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
                    return toSpan('<undefined>', 0);
                }
                else if (typeof content === 'string') {
                    return toSpan(content, 0);
                }
                else if (typeof content.toString === 'function') {
                    return toSpan(content.toString(), 0);
                }
                else {
                    return toSpan(typeof content, 0);
                }
            }
        }
        catch (err) {
            return createErrorElement(err);
        }
    }
    async fetchBranch(treePanel, showsLoading, getter, topLevel) {
        var _a;
        const ac = new AbortController();
        showsLoading.classList.add('_loading');
        try {
            this._abortControllers.set(treePanel, ac);
            const branches = await getter(ac.signal);
            const hadFocus = isFocusWithin(this._root);
            const branchDivs = [];
            let onlyLeafs = true;
            for (const branch of branches) {
                const branchDiv = document.createElement('div');
                branchDiv.className = '_branch';
                branchDiv.appendChild(this.createElement(branch.content, branch.getChildren !== undefined));
                if (branch.getChildren !== undefined) {
                    onlyLeafs = false;
                    const branchTreePanel = document.createElement('div');
                    branchTreePanel.className = 'tree_panel';
                    this._sources.set(branchTreePanel, branch.getChildren);
                    branchDiv.classList.add('_closed');
                    branchDiv.appendChild(branchTreePanel);
                }
                this._content.set(branchDiv, branch.content);
                setDataContext(branchDiv, branch.content);
                branchDivs.push(branchDiv);
            }
            treePanel.append(...branchDivs);
            this._abortControllers.delete(treePanel);
            this._sources.delete(treePanel);
            if (onlyLeafs && this.hasAttribute('freeze-leaf-pane-dimensions')) {
                treePanel.style.width = treePanel.scrollWidth.toString() + "px";
                treePanel.style.height = treePanel.scrollHeight.toString() + "px";
            }
            if (topLevel) {
                if (branchDivs.length > 0) {
                    this._selectedBranch = branchDivs[0];
                    this._selectedBranch.classList.add('selected');
                    if (hadFocus) {
                        const focusable = firstFocusableDescendantAndSelf(this._selectedBranch.firstChild);
                        (_a = focusable) === null || _a === void 0 ? void 0 : _a.focus();
                    }
                    this._root.tabIndex = -1;
                }
            }
        }
        catch (err) {
            if (!ac.signal.aborted) {
                treePanel.appendChild(createErrorElement(err));
                this._abortControllers.delete(treePanel);
                this._sources.delete(treePanel);
            }
        }
        showsLoading.classList.remove('_loading');
    }
    get freeze_leaf_pane_dimensions() {
        return this.hasAttribute('freeze-leaf-pane-dimensions');
    }
    set freeze_leaf_pane_dimensions(val) {
        if (val) {
            this.setAttribute('freeze-leaf-pane-dimensions', '');
        }
        else {
            this.removeAttribute('freeze-leaf-pane-dimensions');
        }
    }
    onFocusIn(ev) {
        for (const el of ev.composedPath()) {
            if (el == this._root)
                break;
            if (el instanceof HTMLDivElement && el.classList.contains('_branch')) {
                if (this._selectedBranch !== el) {
                    if (this._selectedBranch !== undefined) {
                        this._selectedBranch.classList.remove('selected');
                    }
                    this._selectedBranch = el;
                    if (this._selectedBranch !== undefined) {
                        this._selectedBranch.classList.add('selected');
                    }
                }
                break;
            }
        }
    }
    get selectedItem() {
        return this._selectedBranch !== undefined ? getDataContext(this._selectedBranch) : undefined;
    }
    takeFocus() {
        if (this._selectedBranch === undefined) {
            this._root.focus();
        }
        else {
            const foc = getFocusableContent(this._selectedBranch);
            if (foc !== undefined)
                focusAndScrollIntoView(foc);
        }
    }
    focusFirstBranch() {
        const x = first(getFocusableDescendants(this._root));
        if (x === undefined)
            return false;
        focusAndScrollIntoView(x);
        return true;
    }
}
customElements.define('tree-control', TreeControl);
//# sourceMappingURL=tree_control.js.map