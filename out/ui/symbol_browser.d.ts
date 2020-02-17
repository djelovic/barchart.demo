export declare class SymbolBrowser extends HTMLElement {
    private readonly _shadow;
    private readonly _searchInput;
    private readonly _listBox;
    private readonly _treeControl;
    private readonly _treeService;
    private readonly _clearSearchButton;
    private readonly _searchService;
    private _searchText;
    constructor();
    private onSearchTextChanged;
    private get searchString();
    private set searchString(value);
    private onSearchInputKeyDown;
    private onSearchResultsKeyDown;
    private onClearButtonClicked;
    private onSymbolConfirmed;
    focus(): void;
}
