import { fetchJsonWithRetries } from "../utilities/http.js";
import { ensureInteger, ensureArray, ensureObject, ensureString, ensureOptionalString } from "../utilities/validation.js";
import { MetadataSymbol } from "./metadata_shared.js";
export class SymbolSearchService {
    constructor(rootSymbolService, uri = "https://instruments-cmdtyview.aws.barchart.com/filtered-instruments") {
        this._uri = uri;
        this._rootSymbolService = rootSymbolService;
    }
    static tryParseAlias(pattern) {
        const star = pattern.indexOf('*');
        if (star < 1)
            return undefined;
        const root = pattern.substr(0, star);
        if (star + 1 == pattern.length)
            return { root: root, offset: undefined };
        const offset = Number.parseInt(pattern.substr(star + 1));
        if (Number.isNaN(offset) || offset < 0)
            return undefined;
        return { root: root, offset: offset };
    }
    async rootSearch(root, offset, exchanges, signal) {
        const rootSymbols = await this._rootSymbolService.getRootSymbols(root, exchanges, signal);
        const ret = [];
        if (typeof offset !== "undefined") {
            if (offset === 0) {
                if (typeof rootSymbols.nearby !== "undefined")
                    ret.push(rootSymbols.nearby.alias);
            }
            else if (offset <= rootSymbols.symbols.length) {
                ret.push(rootSymbols.symbols[offset - 1].alias);
            }
        }
        else {
            if (typeof rootSymbols.nearby !== "undefined")
                ret.push(rootSymbols.nearby.alias);
            for (const sym of rootSymbols.symbols) {
                ret.push(sym.alias);
            }
        }
        return ret;
    }
    ensureWireSymbol(path, json) {
        ensureObject(path, json);
        const symbol = json;
        ensureString(path, symbol, "symbol");
        ensureOptionalString(path, symbol, "name");
        ensureInteger(path, symbol, "unitcode");
        ensureOptionalString(path, symbol, "exchange");
        ensureInteger(path, symbol, "symbolType");
    }
    ensureResponse(json) {
        let path = [];
        ensureObject(path, json);
        const response = json;
        ensureArray(path, response, "instruments", this.ensureWireSymbol);
    }
    async realSearch(pattern, exchanges, typeCode, signal) {
        var _a;
        let query = this._uri + "?query=";
        query += encodeURIComponent(pattern);
        if (exchanges.length > 0) {
            query += "&exchanges=" + encodeURIComponent(exchanges[0]);
            for (let x = 1; x < exchanges.length; ++x) {
                query += "," + encodeURIComponent(exchanges[x]);
            }
        }
        if (typeof typeCode !== "undefined")
            query += "&types=" + typeCode.toString();
        const json = await fetchJsonWithRetries(query, { signal: signal });
        this.ensureResponse(json);
        const ret = [];
        for (const inst of json.instruments) {
            if (typeof inst.exchange !== "undefined") {
                ret.push(new MetadataSymbol(inst.symbol, (_a = inst.name, (_a !== null && _a !== void 0 ? _a : inst.symbol)), inst.exchange, inst.symbolType, inst.unitcode));
            }
        }
        return ret;
    }
    async search(pattern, exchanges, typeCode, signal) {
        pattern = pattern.trim();
        if (pattern === "")
            return [];
        const maybePattern = SymbolSearchService.tryParseAlias(pattern);
        if (typeof maybePattern !== "undefined" && ((typeCode !== null && typeCode !== void 0 ? typeCode : 2 == 2))) {
            const root = maybePattern.root;
            const offset = maybePattern.offset;
            return await this.rootSearch(root, offset, exchanges, signal);
        }
        else {
            return await this.realSearch(pattern, exchanges, typeCode, signal);
        }
    }
}
//# sourceMappingURL=symbol_search_service.js.map