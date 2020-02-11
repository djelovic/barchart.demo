export declare function setDataContext(el: Element, context: any): void;
export declare function getDataContext(el: Element | null): any;
export declare function getDataContextDirect(el: Element): any;
export declare class TextBinding extends HTMLElement {
    private readonly _shadow;
    private _text;
    private _dataContext;
    static get observedAttributes(): string[];
    constructor();
    get binding(): string | null;
    set binding(value: string | null);
    get dataContext(): any;
    set dataContext(value: any);
    connectedCallback(): void;
    disconnectedCallback(): void;
    adoptedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    private evaluate;
}
