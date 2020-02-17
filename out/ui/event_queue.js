const _queuedFunctions = [];
const _queuedFunctionsIds = [];
let _nextFunctionId = 0;
let _queuedTimeoutId = undefined;
function binarySearch(arr, val) {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
        const mid = lo + Math.floor((hi - lo) / 2);
        const midVal = arr[mid];
        if (val > midVal)
            lo = mid + 1;
        else if (val < midVal)
            hi = mid;
        else
            return mid;
    }
    return -1;
}
function executeQueuedFunctions() {
    _queuedTimeoutId = undefined;
    let count = 0;
    for (const postHandler of _queuedFunctions) {
        ++count;
        try {
            if (typeof postHandler === 'function') {
                postHandler();
            }
            else {
                postHandler.postCallback();
            }
        }
        catch (err) {
            // remove the processed items, re-queue for execution, and then propagate the exception
            _queuedFunctions.splice(0, count);
            _queuedFunctionsIds.splice(0, count);
            _queuedTimeoutId = setTimeout(executeQueuedFunctions, 0);
            throw err;
        }
    }
    _queuedFunctions.splice(0, _queuedFunctions.length);
    _queuedFunctionsIds.splice(0, _queuedFunctionsIds.length);
}
export function post(postHandler) {
    const id = _nextFunctionId++;
    _queuedFunctions.push(postHandler);
    _queuedFunctionsIds.push(id);
    if (_queuedTimeoutId === undefined)
        _queuedTimeoutId = setTimeout(executeQueuedFunctions, 0);
    return id;
}
export function cancelPost(id) {
    const idx = binarySearch(_queuedFunctionsIds, id);
    if (idx < 0)
        return;
    _queuedFunctions.splice(idx, 1);
    _queuedFunctionsIds.splice(idx, 1);
    if (_queuedFunctions.length === 0 && _queuedTimeoutId !== undefined) {
        clearTimeout(_queuedTimeoutId);
        _queuedTimeoutId = undefined;
    }
}
//# sourceMappingURL=event_queue.js.map