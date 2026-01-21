const fs = require('fs');
const vm = require('vm');
const { JSDOM } = require('jsdom');

(async () => {
    try {
        const dom = new JSDOM(`<!doctype html><html><body></body></html>`);
        const context = {
            window: dom.window,
            document: dom.window.document,
            console: console,
            setTimeout: setTimeout,
            clearTimeout: clearTimeout,
            // Minimal browser shims used by UI_classes
            EventSource: function () { this.close = () => {}; },
            // Mock server call to return an empty data set
            callServerMethod: async () => ({ totalRows: 0, fields: [], data: [], range: { from: 0 }, editSessionId: null }),
            showAlert: (msg) => { console.log('[showAlert]', msg); }
        };

        vm.createContext(context);

        let code = fs.readFileSync('node_modules/my-old-space/drive_forms/resources/public/UI_classes.js', 'utf8');
        // Append a small snippet to expose class declarations to the context global
        code += '\nif (typeof DynamicTable !== "undefined") { this.DynamicTable = DynamicTable; }\n';
        // Run file inside the vm context so classes become properties of the context
        vm.runInContext(code, context, { filename: 'UI_classes.js' });

        const DynamicTable = context.DynamicTable || context.window.DynamicTable;
        if (!DynamicTable) {
            console.error('DynamicTable class not found in evaluated context');
            process.exit(2);
        }

        const t = new DynamicTable({ appName: 'test', tableName: 't' });
        console.log('DynamicTable instance created. refresh exists?', typeof t.refresh === 'function');

        try {
            await t.refresh();
            console.log('refresh() completed successfully');
            process.exit(0);
        } catch (e) {
            console.error('refresh() threw:', e);
            process.exit(3);
        }
    } catch (err) {
        console.error('Test runner error:', err);
        process.exit(1);
    }
})();
