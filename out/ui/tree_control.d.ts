import { PromiseGetter } from '../utilities/async.js';
export declare type TreeBranch = {
    readonly content: any;
    readonly getChildren?: PromiseGetter<Iterable<TreeBranch>>;
};
export declare class TreeControl extends HTMLElement {
    private readonly _shadow;
    private readonly _root;
    private readonly _additionalStyles;
    private readonly _abortControllers;
    private readonly _sources;
    private readonly _content;
    private _toElement;
    private _isConnected;
    private _branchTemplate?;
    private _leafTemplate?;
    private _selectedBranch?;
    constructor();
    static get observedAttributes(): string[];
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    private closeBranch;
    private openBranch;
    private onMouseDown;
    private onClick;
    private onDoubleClick;
    private onKeyDown;
    private onKeyPress;
    private terminateAllActions;
    connectedCallback(): void;
    disconnectedCallback(): void;
    adoptedCallback(): void;
    get dataSource(): PromiseGetter<Iterable<TreeBranch>> | undefined;
    set dataSource(ds: PromiseGetter<Iterable<TreeBranch>> | undefined);
    get branchTemplateId(): string | null;
    set branchTemplateId(id: string | null);
    get leafTemplateId(): string | null;
    set leafTemplateId(id: string | null);
    get externalStylesTemplateId(): string | null;
    set externalStylesTemplateId(id: string | null);
    private set branchTemplate(value);
    private set leafTemplate(value);
    private updateContentRecursively;
    get toElement(): ((value: any) => HTMLElement) | undefined;
    set toElement(func: ((value: any) => HTMLElement) | undefined);
    private createElement;
    private fetchBranch;
    get freeze_leaf_pane_dimensions(): boolean;
    set freeze_leaf_pane_dimensions(val: boolean);
    private onFocusIn;
    get selectedItem(): any;
    focus(): void;
    focusFirstBranch(): boolean;
}
