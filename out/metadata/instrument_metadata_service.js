import { fetchJsonWithRetries } from "../utilities/http.js";
import { ensureInteger, ensureArrayObject, ensureObject, ensureString, ensureOptionalString } from "../utilities/validation.js";
import { MetadataSymbol } from "./metadata_shared.js";
import { CallDemultiplexer } from '../utilities/async.js';
function ensureWireSymbol(path, json) {
    ensureObject(path, json);
    const symbol = json;
    ensureString(path, symbol, "symbol");
    ensureOptionalString(path, symbol, "name");
    ensureInteger(path, symbol, "unitcode");
    ensureString(path, symbol, "exchange");
    ensureInteger(path, symbol, "symbolType");
}
function ensureWireSymbolEntry(path, json) {
    ensureObject(path, json);
    const wireSymbolEntry = json;
    ensureString(path, wireSymbolEntry, "symbol");
    path.push('instrument');
    ensureWireSymbol(path, wireSymbolEntry.instrument);
    path.pop();
}
export class InstrumentMetadataService {
    constructor(uri) {
        this._uri = uri;
        this._demux = new Map();
    }
    getSymbolMetadata(symbol, signal) {
        symbol = symbol.trim();
        let demux = this._demux.get(symbol);
        if (demux === undefined) {
            demux = new CallDemultiplexer(sig => this.getSymbolMetadataInternal(symbol, sig), -1);
            this._demux.set(symbol, demux);
        }
        return demux.call(signal);
    }
    async getSymbolMetadataInternal(symbol, signal) {
        var _a;
        const uri = this._uri + encodeURIComponent(symbol);
        const obj = await fetchJsonWithRetries(uri, { signal: signal });
        ensureArrayObject([], obj, ensureWireSymbolEntry);
        for (const entry of obj) {
            const sym = entry.instrument;
            return new MetadataSymbol(sym.symbol, (_a = sym.name, (_a !== null && _a !== void 0 ? _a : sym.symbol)), sym.exchange, sym.symbolType, sym.unitcode);
        }
        return undefined;
    }
}
//# sourceMappingURL=instrument_metadata_service.js.map