import { ArrayChangedListener, PropertyChangedListener } from '../utilities/object_monitoring.js';
import { PostListener } from './event_queue.js';
export declare function setDataContext(el: HTMLElement, context: any): void;
export declare function getDataContext(el: HTMLElement | null): any;
export declare function getDataContextDirect(el: HTMLElement): any;
export declare class TextBinding extends HTMLElement implements ArrayChangedListener<any>, PropertyChangedListener<object>, PostListener {
    private readonly _shadow;
    private _text;
    private _dataContext;
    private _dependsOn?;
    private _postId?;
    private _dirty;
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
    private unsubscribeFromDependencies;
    private evaluate;
    arrayChangedCallback(target: ReadonlyArray<any>, index: number, inserted: number, deleted: number): void;
    propertyChangedCallback(target: object, property: PropertyKey): void;
    private onDependencyChanged;
    postCallback(): void;
}
