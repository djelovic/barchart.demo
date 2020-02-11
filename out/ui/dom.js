import { first } from '../utilities/iterables.js';
export function getTemplateById(element, id) {
    if (id === null) {
        return undefined;
    }
    else {
        var root = element.getRootNode();
        if (root.getElementById === undefined)
            root = document;
        const el = root.getElementById(id);
        return el instanceof HTMLTemplateElement ? el : undefined;
    }
}
export function* descendantHtmlElements(parent) {
    const children = parent.shadowRoot !== null ? parent.shadowRoot.children : parent.children;
    for (const el of children) {
        if (el instanceof HTMLElement) {
            yield el;
            yield* descendantHtmlElements(el);
        }
    }
}
export function* descendantHtmlElementsAndSelf(parent) {
    yield parent;
    yield* descendantHtmlElements(parent);
}
export function isVisible(el) {
    const style = getComputedStyle(el, undefined);
    return style === undefined || style.display !== 'none';
}
export function isTabStop(el) {
    return el.tabIndex >= 0;
}
export function firstFocusableDescendant(parent) {
    return first(descendantHtmlElements(parent), x => isVisible(x) && isTabStop(x));
}
export function firstFocusableDescendantAndSelf(parent) {
    return first(descendantHtmlElementsAndSelf(parent), x => isVisible(x) && isTabStop(x));
}
export function* getFocusableElements(parent) {
    if (parent.tabIndex >= 0)
        yield parent;
    yield* getFocusableDescendants(parent);
}
export function* getFocusableDescendants(parent) {
    const children = parent.shadowRoot !== null ? parent.shadowRoot.children : parent.children;
    for (const el of children) {
        if (!(el instanceof HTMLElement))
            continue;
        const style = getComputedStyle(el, undefined);
        if (style !== undefined && style.display === 'none')
            continue;
        if (el.tabIndex >= 0) {
            yield el;
        }
        yield* getFocusableDescendants(el);
    }
}
export function* getFocusableChildrenInReverse(parent) {
    const children = parent.shadowRoot !== null ? parent.shadowRoot.children : parent.children;
    let x = children.length;
    while (--x >= 0) {
        const el = children[x];
        if (!(el instanceof HTMLElement))
            continue;
        const style = getComputedStyle(el, undefined);
        if (style !== undefined && style.display === 'none')
            continue;
        yield* getFocusableChildrenInReverse(el);
        if (el.tabIndex >= 0) {
            yield el;
        }
    }
}
export function tryGetLoneElement(frag) {
    let only = undefined;
    for (const node of frag.childNodes) {
        if (node instanceof Text) {
            if (node.textContent === null)
                continue;
            if (node.textContent.match(/\S/))
                return undefined;
        }
        else if (node instanceof HTMLElement) {
            if (only === undefined)
                only = node;
            else
                return undefined;
        }
        else {
            return undefined;
        }
    }
    return only;
}
export function focusAndScrollIntoView(x) {
    x.focus({ preventScroll: true });
    x.scrollIntoView({ block: "nearest" });
}
export function isDescendantOrSelf(maybeDescendant, parent) {
    while (maybeDescendant != null) {
        if (maybeDescendant === parent)
            return true;
        maybeDescendant = maybeDescendant.parentElement;
    }
    return false;
}
export function getFocusedElement() {
    let el = document.activeElement;
    while (el != null) {
        if (el.shadowRoot === null || el.shadowRoot.activeElement === null)
            return el;
        else
            el = el.shadowRoot.activeElement;
    }
    return null;
}
export function isFocused(el) {
    return getFocusedElement() === el;
}
export function isFocusWithin(el) {
    return isDescendantOrSelf(getFocusedElement(), el);
}
//# sourceMappingURL=dom.js.map