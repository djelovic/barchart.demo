export declare function getTemplateById(element: Node, id: string | null): HTMLTemplateElement | undefined;
export declare function descendantHtmlElements(parent: HTMLElement): Iterable<HTMLElement>;
export declare function descendantHtmlElementsAndSelf(parent: HTMLElement): Iterable<HTMLElement>;
export declare function isVisible(el: Element): boolean;
export declare function isTabStop(el: HTMLOrSVGElement): boolean;
export declare function firstFocusableDescendant(parent: HTMLElement): HTMLElement | undefined;
export declare function firstFocusableDescendantAndSelf(parent: HTMLElement): HTMLElement | undefined;
export declare function getFocusableElements(parent: HTMLElement): Iterable<HTMLElement>;
export declare function getFocusableDescendants(parent: HTMLElement): Iterable<HTMLElement>;
export declare function getFocusableChildrenInReverse(parent: HTMLElement): Iterable<HTMLElement>;
export declare function tryGetLoneElement(frag: DocumentFragment): HTMLElement | undefined;
export declare function focusAndScrollIntoView(x: HTMLElement): void;
export declare function isDescendantOrSelf(maybeDescendant: Element | null, parent: Element): boolean;
export declare function getFocusedElement(): Element | null;
export declare function isFocused(el: Element): boolean;
export declare function isFocusWithin(el: Element): boolean;