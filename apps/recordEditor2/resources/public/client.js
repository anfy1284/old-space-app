/**
 * myNewApp Application - Client Side
 */

try {
    (async function() {
        let APP_NAME = 'recordEditor2'
        const APP_CONFIG = {};

        // Use framework `App` helper to build descriptor; override instance creation
        const app = new App(APP_NAME, { config: { allowMultipleInstances: true } });

        // Provide app-specific createInstance that sets up the DataForm.
        app.createInstance = async function(params) {
            const instanceId = this.generateInstanceId();
            const container = null; // App decides not to create per-instance container

            const appForm = new DataForm(APP_NAME);
            appForm.setTitle(APP_NAME);
            appForm.setWidth(800);
            appForm.setHeight(600);
            appForm.setX(100);
            appForm.setY(100);

            function instanceOnOpen(dbTable) {
                appForm.dbTable = dbTable || null;
                if (!dbTable) {
                    if (typeof showAlert === 'function') showAlert('Не указана таблица базы данных!');
                    return;
                }
                try { appForm.Draw(); } catch (e) { console.error(e); }
            }

            const instance = {
                id: instanceId,
                appName: APP_NAME,
                container,
                form: appForm,
                onOpen(params) {
                    const tableName = params && (params.dbTable || params.table);
                    instanceOnOpen(tableName);
                },
                onAction(action, params) {
                    if (typeof appForm.doAction === 'function') {
                        try { appForm.doAction(action, params); } catch (e) { console.error(e); }
                    }
                },
                destroy() {
                    try { if (typeof appForm.destroy === 'function') appForm.destroy(); } catch (e) {}
                }
            };

            if (params && (params.dbTable || params.table)) instance.onOpen(params);
            return instance;
        };

        try { app.register(); } catch (e) { console.error('Failed to register app descriptor', e); }

        // Background config fetch disabled: this app works with server-provided
        // settings and the project doesn't host /apps/recordEditor/config.json.
        // If you later want to enable external overrides, restore the fetch
        // from /apps/recordEditor/config.json and merge into `APP_CONFIG`.

        console.log('[' + APP_NAME + '] Client descriptor registered via App helper');

    })();
} catch (error) {
    console.error('[recordEditor] Error initializing client descriptor:', error);
}
