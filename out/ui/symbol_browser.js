import { ExchangesService } from '../metadata/exchanges_service.js';
import { SymbolSearchService } from '../metadata/symbol_search_service.js';
import { RootSymbolService } from '../metadata/root_symbol_service.js';
import { SymbolTreeService } from '../metadata/symbol_tree_service.js';
import { sleepAsync } from '../utilities/async.js';
function* branchChildrenToTreeItems(children) {
    for (const branch of children.branches) {
        yield {
            content: branch.name,
            getChildren: async (sig) => branchChildrenToTreeItems(await branch.getChildren(sig))
        };
    }
    for (const symbol of children.symbols) {
        yield {
            content: symbol
        };
    }
}
export class SymbolBrowser extends HTMLElement {
    constructor() {
        super();
        this._searchText = '';
        this._shadow = this.attachShadow({ mode: 'open' });
        this._shadow.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    flex-direction: column;
                    overflow: hidden;

                    --clear-search-font-family: codicon;
                    --clear-search-glyph: "\\eaB8";
                    --search-text-border-bottom: 1px solid #D9D9D9;

                    --selection-background: #eaf5ff;
                    --selection-border: #e5f3ff solid 1px;
                    --focus-background: #CCE8FF;
                    --focus-border: #99D1FF solid 1px;
                    --progress-color: #3393DF;
                    --progress-speed: 1s;
                }
                :host[hidden] {
                    display: none;
                }
                ._input-container {
                    flex: 0 0 auto;
                    border-bottom: var(--search-text-border-bottom);
                    display: flex;
                    flex-direction: row;
                }
                ._input-container > button {
                    flex: 0 0 auto;
                    background-color: unset;
                    border: none;
                    outline: none;
                }
                ._input-container > button:hover {
                    color: red;
                }
                ._input-container > button:focus-within {
                    color: red;
                }
                ._input-container > button > span::after {
                    font-family: var(--clear-search-font-family);
                    content: var(--clear-search-glyph);
                }
                input[type=text] {
                    flex: 1 0 0;
                    border: none;
                    padding: 0.4em;
                    outline: none;
                }
                tree-control {
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    flex: 1 1 auto;
                    overflow: auto;
                    --chevron-padding: 0.2em 0em 0em 0em;
                    --chevron-width: 1.3em;
                    --selection-background: inherit;
                    --selection-border: inherit;
                    --focus-background: inherit;
                    --focus-border: inherit;
                    --progress-color: inherit;
                    --progress-speed: inherit;

                    --padding: 0.2em;
                }
                list-box {
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    flex: 1 1 auto;
                    overflow: auto;

                    --selection-background: inherit;
                    --selection-border: inherit;
                    --focus-background: inherit;
                    --focus-border: inherit;
                    --progress-color: inherit;
                    --progress-speed: inherit;
                }
                ._hidden {
                    display: none;
                }
            </style>

            <template id="branch_template">
                <text-binding class="branch" tabindex="0" binding="this"></text-binding>
            </template>

            <template id="leaf_template">
                <span class="symbol" tabindex="0">
                    <text-binding binding="this.symbol"></text-binding> - <text-binding class="description" binding="this.description"></text-binding>
                </span>
            </template>

            <template id="tree_styles">
                <style>
                    .branch {
                        padding: calc(0.2em - 1px) calc(0.3em - 1px);
                    }
                    .symbol {
                        padding: calc(0.2em - 1px) calc(0.3em - 1px);
                    }
                </style>
            </template>
            
            <template id="search_result">
                <div class="search_result" tabindex="0">
                    <div><text-binding class="symbol" binding="this.symbol"></text-binding> - <text-binding class="exchange" binding="this.exchange"></text-binding></div>
                    <div><text-binding class="description" binding="this.description"></text-binding></div>
                </div>
            </template>

            <template id="list_styles">
                <style>
                    .search_result {
                        padding: calc(0.3em - 1px);
                    }
                    .symbol {
                        font-weight: 500;
                    }
                    .exchange {
                        font-size: 0.9em;
                    }
                    .description {
                        font-size: 0.9em;
                    }
                </style>
            </template>

            <div class="_input-container">
                <input id="search_box" type="text" placeholder="Search">
                <button id="clear-button" class="_hidden" tabIndex="-1"><span></span></button>
            </div>
            
            <tree-control id="symbol_tree" branchTemplateId="branch_template" leafTemplateId="leaf_template" externalStylesTemplateId="tree_styles" freeze-leaf-pane-dimensions>
            </tree-control>

            <list-box id="search_results" class="_hidden" templateid="search_result" externalStylesTemplateId="list_styles">
            </list-box>
        `;
        this._searchInput = this._shadow.getElementById('search_box');
        this._treeControl = this._shadow.getElementById('symbol_tree');
        this._listBox = this._shadow.getElementById("search_results");
        this._clearSearchButton = this._shadow.getElementById('clear-button');
        const exchangeService = new ExchangesService();
        this._treeService = new SymbolTreeService(exchangeService);
        const rootService = new RootSymbolService();
        this._searchService = new SymbolSearchService(rootService);
        this._treeControl.dataSource = async (sig) => {
            const root = await this._treeService.getRoot(sig);
            const children = await root.getChildren(sig);
            return branchChildrenToTreeItems(children);
        };
        this._searchInput.addEventListener('input', _ => this.onSearchTextChanged());
        this._searchInput.addEventListener('keydown', ev => this.onSearchInputKeyDown(ev));
        this._listBox.addEventListener('keydown', ev => this.onSearchResultsKeyDown(ev));
        this._clearSearchButton.addEventListener('click', ev => this.onClearButtonClicked(ev));
        this._treeControl.addEventListener('tree_leaf_confirmed', ev => this.onSymbolConfirmed(ev));
        this._listBox.addEventListener('list_box_item_confirmed', ev => this.onSymbolConfirmed(ev));
    }
    onSearchTextChanged() {
        this.searchString = this._searchInput.value.trim();
    }
    get searchString() {
        return this._searchText;
    }
    set searchString(val) {
        if (val === this._searchText)
            return;
        this._searchText = val;
        if (this._searchText === '') {
            this._listBox.dataSource = undefined;
            this._treeControl.classList.remove('_hidden');
            this._listBox.classList.add('_hidden');
            this._clearSearchButton.classList.add('_hidden');
        }
        else {
            this._treeControl.classList.add('_hidden');
            this._listBox.classList.remove('_hidden');
            this._clearSearchButton.classList.remove('_hidden');
            this._listBox.dataSource = async (sig) => {
                await sleepAsync(200, sig);
                return await this._searchService.search(val, [], undefined, sig);
            };
        }
    }
    onSearchInputKeyDown(ev) {
        if (ev.key === 'Escape') {
            this._searchInput.value = '';
            this.searchString = '';
            this._treeControl.takeFocus();
            ev.stopPropagation();
            ev.preventDefault();
        }
        else if (this.searchString !== '' && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
            ev.stopPropagation();
            ev.preventDefault();
            const selectedIndex = this._listBox.selectedIndex;
            if (this._listBox.itemCount > 0) {
                if (ev.key === 'ArrowUp') {
                    if (selectedIndex > 0) {
                        this._listBox.selectedIndex = selectedIndex - 1;
                    }
                }
                else {
                    if (selectedIndex + 1 < this._listBox.itemCount) {
                        this._listBox.selectedIndex = selectedIndex + 1;
                    }
                }
            }
        }
        else if (this.searchString === '' && ev.key === 'ArrowDown') {
            this._searchInput.value = '';
            if (this._treeControl.focusFirstBranch()) {
                ev.stopPropagation();
                ev.preventDefault();
            }
        }
        else if (ev.key === 'Enter') {
            if (this._listBox.selectedIndex >= 0) {
                const event = new CustomEvent('symbol_confirmed', { detail: this._listBox.getItem(this._listBox.selectedIndex) });
                if (this.dispatchEvent(event)) {
                    const next = this._listBox.selectedIndex + 1;
                    if (next < this._listBox.itemCount) {
                        this._listBox.selectedIndex = next;
                    }
                }
            }
        }
    }
    onSearchResultsKeyDown(ev) {
        if (ev.key === 'Escape') {
            this._searchInput.value = '';
            this.searchString = '';
            ev.preventDefault();
        }
    }
    onClearButtonClicked(ev) {
        this._searchInput.value = '';
        this.searchString = '';
        this._searchInput.focus();
        ev.preventDefault();
    }
    onSymbolConfirmed(ev) {
        if (!(ev instanceof CustomEvent))
            return;
        ev.preventDefault();
        ev.stopPropagation();
        const symbol = ev.detail;
        const event = new CustomEvent('symbol_confirmed', { detail: symbol });
        if (this.dispatchEvent(event)) {
            const next = this._listBox.selectedIndex + 1;
            if (next < this._listBox.itemCount) {
                this._listBox.selectedIndex = next;
            }
        }
    }
    takeFocus() {
        this._treeControl.takeFocus();
    }
}
customElements.define('symbol-browser', SymbolBrowser);
//# sourceMappingURL=symbol_browser.js.map