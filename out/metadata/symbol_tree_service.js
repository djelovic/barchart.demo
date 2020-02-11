import { fetchJsonWithRetries } from "../utilities/http.js";
import { MetadataSymbol } from "./metadata_shared.js";
import { ensureObject, ensureArray, ensureString, ensureStringValue, ensureInteger, ensureOptionalString } from "../utilities/validation.js";
import { CallDemultiplexer } from "../utilities/async.js";
function ensureMeta(path, obj) {
    ensureObject(path, obj);
    const meta = obj;
    ensureArray(path, meta, "exchanges", ensureStringValue);
}
function ensureTreeNodeItem(path, obj) {
    ensureObject(path, obj);
    const item = obj;
    ensureString(path, item, "symbol");
    ensureString(path, item, "name");
    ensureInteger(path, item, "type");
    ensureOptionalString(path, item, "exchange");
    ensureInteger(path, item, "unitcode");
    ensureOptionalString(path, item, "root");
}
function ensureTreeNode(path, obj) {
    ensureObject(path, obj);
    const node = obj;
    ensureString(path, node, "key");
    if (node.meta !== undefined) {
        path.push("meta");
        ensureMeta(path, node.meta);
        path.pop();
    }
    if (node.item !== undefined) {
        path.push("item");
        ensureTreeNodeItem(path, node.item);
        path.pop();
    }
}
function ensureTreeResponse(obj) {
    let path = [];
    ensureObject(path, obj);
    const resp = obj;
    ensureArray(path, resp, "nodes", ensureTreeNode);
}
export class BranchChildren {
    constructor(branches, symbols) {
        this.branches = branches;
        this.symbols = symbols;
    }
}
class KnownChildrenTreeBranch {
    constructor(name, children) {
        this.name = name;
        this._children = children;
    }
    getChildren(signal) {
        return Promise.resolve(this._children);
    }
}
class TreeBranchImpl {
    constructor(uri, name, key, parentPath, exchanges, exchangesMap) {
        this._uri = uri;
        this.name = name;
        this._parentPath = parentPath;
        this._key = key;
        this.exchanges = exchanges;
        this._exchangesMap = exchangesMap;
        this._demux = new CallDemultiplexer(signal => this.getChildrenInternal(signal), -1);
    }
    async getChildren(signal) {
        return this._demux.call(signal);
    }
    async getChildrenInternal(signal) {
        var _a, _b, _c, _d;
        let path = this._parentPath.slice();
        if (this._key !== undefined)
            path.push(this._key);
        let queryString = this._uri;
        for (let x = 0; x < path.length; ++x) {
            queryString += x === 0 ? "?" : "&";
            queryString += TreeBranchImpl._querySegments[x] + "=" + encodeURIComponent(path[x]);
        }
        const response = await fetchJsonWithRetries(queryString, { signal: signal });
        ensureTreeResponse(response);
        const branches = [];
        const symbols = [];
        for (const node of response.nodes) {
            if (node.item !== undefined) {
                if (node.item.exchange !== undefined) {
                    symbols.push(new MetadataSymbol(node.item.symbol, node.item.name, node.item.exchange, node.item.type, node.item.unitcode));
                }
            }
            else {
                const description = (_a = this._exchangesMap.get(node.key)) === null || _a === void 0 ? void 0 : _a.description;
                branches.push(new TreeBranchImpl(this._uri, (description !== null && description !== void 0 ? description : node.key), node.key, path, (_d = (_c = (_b = node) === null || _b === void 0 ? void 0 : _b.meta) === null || _c === void 0 ? void 0 : _c.exchanges, (_d !== null && _d !== void 0 ? _d : [])), this._exchangesMap));
            }
        }
        branches.sort((a, b) => a.name.localeCompare(b.name));
        const stride = 500;
        if (symbols.length > stride) {
            for (let x = 0; x < symbols.length; x += stride) {
                const segment = symbols.slice(x, x + stride);
                branches.push(new KnownChildrenTreeBranch('Part ' + (x / stride + 1).toString(), new BranchChildren([], segment)));
            }
            return new BranchChildren(branches, []);
        }
        else {
            return new BranchChildren(branches, symbols);
        }
    }
}
TreeBranchImpl._querySegments = ["first", "second", "third", "fourth", "fifth", "sixth"];
export class SymbolTreeService {
    constructor(exchangeService, uri = "https://instruments-cmdtyview.aws.barchart.com/browser/search") {
        this._uri = uri;
        this._demux = new CallDemultiplexer(signal => this.getRootInternal(signal), -1);
        this._exchangeService = exchangeService;
    }
    getRoot(signal) {
        return this._demux.call(signal);
    }
    async getRootInternal(signal) {
        const exchangesMap = await this._exchangeService.getExchanges(signal);
        return new TreeBranchImpl(this._uri, "Root", undefined, [], [], exchangesMap);
    }
}
//# sourceMappingURL=symbol_tree_service.js.map