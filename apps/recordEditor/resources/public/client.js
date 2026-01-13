/**
 * myNewApp Application - Client Side
 */

try {
    (function() {
        // Use a fixed app name here — config is not available to client reliably
        const APP_NAME = 'recordEditor';
        const APP_CONFIG = {};

        // Descriptor implementing createInstance(params) -> instance
        const descriptor = {
            // Default config; later we can read from config.json and set allowMultipleInstances
            config: { allowMultipleInstances: false },

            init() {
                console.log('[' + APP_NAME + '] descriptor initialized');
            },

            async createInstance(params) {
                // Each instance gets its own container and Form
                const instanceId = APP_NAME + '-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
                const container = document.createElement('div');
                container.dataset.instanceId = instanceId;
                document.body.appendChild(container);

                const appForm = new Form();
                appForm.setTitle(APP_NAME);
                appForm.setWidth(800);
                appForm.setHeight(600);
                appForm.setX(100);
                appForm.setY(100);

                // Preserve original Draw behaviour but scoped to this instance
                const originalDraw = appForm.Draw.bind(appForm);
                appForm.Draw = function(parent) {
                    originalDraw(parent);
                    const contentArea = this.getContentArea();
                    contentArea.style.display = 'flex';
                    contentArea.style.flexDirection = 'column';
                    contentArea.style.padding = '10px';

                    const welcomeText = document.createElement('div');
                    try {
                        welcomeText.textContent = 'Добро пожаловать в приложение ' + APP_NAME + '! Params: ' + (params ? JSON.stringify(params) : 'none');
                    } catch (e) {
                        welcomeText.textContent = 'Добро пожаловать в приложение ' + APP_NAME + '!';
                    }
                    welcomeText.style.fontSize = '18px';
                    welcomeText.style.marginBottom = '20px';
                    contentArea.appendChild(welcomeText);
                };

                // onOpen for this instance
                function instanceOnOpen(dbTable) {
                    appForm.dbTable = dbTable || null;
                    if (!dbTable) {
                        if (typeof showAlert === 'function') showAlert('Не указана таблица базы данных!');
                        return;
                    }
                    appForm.Draw(container);
                }

                // wire action handler
                appForm.doAction = function(action, p) {
                    if (action === 'open') {
                        const tableName = (p && p.dbTable) || undefined;
                        instanceOnOpen(tableName);
                    }
                };

                const instance = {
                    id: instanceId,
                    appName: APP_NAME,
                    container,
                    onOpen(params) {
                        const tableName = params && params.dbTable;
                        instanceOnOpen(tableName);
                    },
                    onAction(action, params) {
                        if (typeof appForm.doAction === 'function') {
                            try { appForm.doAction(action, params); } catch (e) { console.error(e); }
                        }
                    },
                    destroy() {
                        try {
                            if (typeof appForm.destroy === 'function') appForm.destroy();
                        } catch (e) {}
                        try { container.remove(); } catch (e) {}
                    }
                };

                // If initial params include open, call onOpen
                if (params && params.dbTable) {
                    instance.onOpen(params);
                }

                return instance;
            }
        };

        // Register descriptor via framework-level registrar `window.MySpace.register`
        if (window.MySpace && typeof window.MySpace.register === 'function') {
            window.MySpace.register(APP_NAME, descriptor);
        } else {
            console.error('Framework registrar window.MySpace.register is not available — please expose it at drive_forms level');
        }

        console.log('[' + APP_NAME + '] Client descriptor registered');

    })();
} catch (error) {
    console.error('[recordEditor] Error initializing client descriptor:', error);
}
