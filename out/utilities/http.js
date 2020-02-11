import { sleepAsync } from "./async.js";
export class HttpError extends Error {
    constructor(status, statusText, responseText) {
        super("HTTP Error " + status.toString() + " - " + statusText);
        this.status = status;
        this.statusText = statusText;
        this.responseText = responseText;
    }
    static throwOnError(response, responseText) {
        if (!response.ok) {
            throw new HttpError(response.status, response.statusText, responseText);
        }
    }
}
export async function fetchWithRetries(request, init) {
    if (typeof fetch !== 'function') {
        throw new Error('Function fetch does not exist.');
    }
    for (;;) {
        try {
            const response = await fetch(request, init);
            if (response.status < 500) {
                return response;
            }
            else {
                console.error("Retrying because of error: " + response.status.toString() + ": " + response.statusText);
            }
        }
        catch (error) {
            console.error("Retrying because of error during fetch: " + error);
        }
        await sleepAsync(15000, init.signal);
    }
}
export async function fetchTextWithRetries(request, init) {
    if (!(init.signal instanceof AbortSignal)) {
        throw new Error('An abort signal must be passed to fetchWithRetries as part of init');
    }
    for (;;) {
        const response = await fetchWithRetries(request, init);
        let text;
        try {
            text = await response.text();
        }
        catch (error) {
            console.error("Error reading the response text: " + error.toString());
            await (sleepAsync(15000, init.signal));
            continue;
        }
        HttpError.throwOnError(response, text);
        return text;
    }
}
export async function fetchJsonWithRetries(request, init) {
    const text = await fetchTextWithRetries(request, init);
    return JSON.parse(text);
}
//# sourceMappingURL=http.js.map