var _a;
import { toMonitoredObject } from './utilities/object_monitoring.js';
const symbolBrowser = document.getElementById('symbol-browser');
const resultsList = document.getElementById('results');
const container = document.getElementById('container');
const results = toMonitoredObject([]);
resultsList.dataSource = async (sig) => results;
symbolBrowser.addEventListener('symbol_confirmed', ev => {
    results.push(ev.detail);
    resultsList.selectedIndex = results.length - 1;
});
resultsList.addEventListener('list_box_item_delete_requested', ev => {
    if (resultsList.selectedIndex >= 0) {
        ev.stopPropagation();
        results.splice(resultsList.selectedIndex, 1);
    }
});
resultsList.addEventListener('click', ev => {
    const start = ev.composedPath()[0];
    if (start instanceof HTMLButtonElement && start.classList.contains('delete-button')) {
        ev.stopPropagation();
        results.splice(resultsList.selectedIndex, 1);
    }
});
(_a = container) === null || _a === void 0 ? void 0 : _a.addEventListener('mousedown', ev => {
    if (ev.target === container) {
        ev.preventDefault();
    }
});
symbolBrowser.focus();
//# sourceMappingURL=uitests.js.map