import { fetchJsonWithRetries } from "../utilities/http.js";
import { ensureInteger, ensureArray, ensureObject, ensureString, ensureOptionalString, ensureBoolean, ensureIntegerOrString } from "../utilities/validation.js";
import { MetadataSymbol } from "./metadata_shared.js";
export class SymbolAndAlias {
    constructor(symbol, alias) {
        this.symbol = symbol;
        this.alias = alias;
    }
}
export class RootSymbolsResult {
    constructor(symbols, nearby) {
        this.symbols = symbols;
        this.nearby = nearby;
    }
}
function ensureWireRootContract(path, obj) {
    ensureObject(path, obj);
    const contract = obj;
    ensureString(path, contract, "month");
    ensureBoolean(path, contract, "nearest");
    ensureIntegerOrString(path, contract, "year");
}
function ensureWireRoot(path, obj) {
    ensureObject(path, obj);
    const root = obj;
    ensureString(path, root, "root");
    ensureOptionalString(path, root, "description");
    ensureString(path, root, "exchange");
    ensureInteger(path, root, "futuresunit");
    ensureArray(path, root, "contracts", ensureWireRootContract);
}
export class RootSymbolService {
    constructor(uri = "https://webapp-proxy.aws.barchart.com/v1/platform-services/apps/all/getAllFutures.php?root=") {
        this._uri = uri;
    }
    async getRootSymbols(root, exchanges, signal) {
        var _a;
        const symbols = new Array();
        let nearby;
        root = root.trim();
        if (root == "") {
            return new RootSymbolsResult(symbols, nearby);
        }
        const uri = this._uri + encodeURIComponent(root);
        const obj = await fetchJsonWithRetries(uri, { signal: signal });
        if (!obj.allFutures)
            throw new Error(`Property 'allFutures' does not exist for {uri}`);
        if (obj.allFutures instanceof Array && obj.allFutures.length > 0) {
            for (let x = 0; x < obj.allFutures.length; ++x) {
                const allFutX = obj.allFutures[x];
                if (typeof allFutX !== "object")
                    continue;
                if (allFutX instanceof Array)
                    continue;
                const properties = Object.getOwnPropertyNames(allFutX);
                if (properties.length != 1)
                    continue;
                const wire = allFutX[properties[0]];
                ensureWireRoot(["allFutures", x, properties[0]], wire);
                if (exchanges.length != 0 && exchanges.indexOf(wire.exchange) < 0)
                    continue;
                if (!Number.isInteger(wire.futuresunit))
                    continue;
                const description = (_a = wire.description, (_a !== null && _a !== void 0 ? _a : wire.root));
                for (let y = 0; y < wire.contracts.length; ++y) {
                    const contract = wire.contracts[y];
                    const forward = new MetadataSymbol(wire.root + "*" + (y + 1), description + " Month " + (y + 1).toString(), wire.exchange, 2, wire.futuresunit);
                    let realDesc = description;
                    if (contract.month.length == 1) {
                        let month = "FGHJKMNQUVXZ".indexOf(contract.month);
                        if (month >= 0) {
                            realDesc += " " + RootSymbolService._monthNames[month] + " " + contract.year.toString();
                        }
                    }
                    const year = typeof contract.year == "string" ? Number.parseInt(contract.year) : contract.year;
                    const future = new MetadataSymbol(wire.root + contract.month + (year % 100).toString().padStart(2, "0"), realDesc, wire.exchange, 2, wire.futuresunit);
                    symbols.push(new SymbolAndAlias(future, forward));
                    if (contract.nearest) {
                        const frontMonth = new MetadataSymbol(wire.root + "*0", description + " Front Month", wire.exchange, 2, wire.futuresunit);
                        nearby = new SymbolAndAlias(future, frontMonth);
                    }
                }
            }
        }
        return new RootSymbolsResult(symbols, nearby);
    }
}
RootSymbolService._monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
//# sourceMappingURL=root_symbol_service.js.map