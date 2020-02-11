import { fetchJsonWithRetries } from "../utilities/http.js";
import { ensureObject, ensureString, ensureArrayObject, ensureOptionalString } from "../utilities/validation.js";
import { CallDemultiplexer } from "../utilities/async.js";
export class Exchange {
    constructor(id, description, timeZone) {
        this.id = id;
        this.description = description;
        this.timeZone = timeZone;
    }
}
export class ExchangesService {
    constructor(uri = "https://instruments-cmdtyview.aws.barchart.com/exchanges") {
        this._uri = uri;
        this._demux = new CallDemultiplexer(signal => this.getExchangesInternal(signal), -1);
    }
    static ensureWireExchange(path, json) {
        ensureObject(path, json);
        const exchange = json;
        ensureString(path, exchange, "id");
        ensureString(path, exchange, "description");
        ensureOptionalString(path, exchange, "timezoneLocal");
        ensureOptionalString(path, exchange, "timezoneDdf");
    }
    async getExchangesInternal(signal) {
        var _a;
        const json = await fetchJsonWithRetries(this._uri, { signal: signal });
        const path = [];
        ensureArrayObject(path, json, ExchangesService.ensureWireExchange);
        const map = new Map();
        for (const ex of json) {
            map.set(ex.id, new Exchange(ex.id, ex.description, (_a = ex.timezoneLocal, (_a !== null && _a !== void 0 ? _a : undefined))));
        }
        return map;
    }
    getExchanges(signal) {
        return this._demux.call(signal);
    }
}
//# sourceMappingURL=exchanges_service.js.map