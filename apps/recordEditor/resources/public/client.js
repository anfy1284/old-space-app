/**
 * myNewApp Application - Client Side
 */

try {
    (async function() {
        let APP_NAME = 'recordEditor'
        const APP_CONFIG = {};

        // Descriptor implementing createInstance(params) -> instance
        const descriptor = {
            // Default config; can be overridden by apps/recordEditor/config.json
            // Set to true by default to avoid temporary re-registration toggles
            config: { allowMultipleInstances: true },

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
                const controlsMap = {};
                appForm.setTitle(APP_NAME);
                appForm.setWidth(800);
                appForm.setHeight(600);
                appForm.setX(100);
                appForm.setY(100);

                appForm.renderLayout = async function(contentArea = null, layout = null) {
                    if (!contentArea) contentArea = this.getContentArea();
                    const items = layout || this.layout || [];
                    for (const item of items) {
                        await this.renderItem(item, contentArea);
                    }
                };

                appForm.renderItem = async function(item, contentArea = null) {
                    contentArea = contentArea || this.getContentArea();
                    let element = null;
                    const caption = item.caption || '';
                    const properties = item.properties || {};
                    switch (item.type) {
                        case 'number': {
                            properties.digitsOnly = true;
                        }
                        case 'textbox': {
                            // Create textbox as a child of contentArea so it participates in the layout
                            const tb = new TextBox(contentArea, properties);
                            // Determine initial value: explicit item.value, or lookup by item.data from loaded data
                            let tbValue = '';
                            if (item.value !== null && item.value !== undefined) tbValue = item.value;
                            else if (item.data && this._dataMap && Object.prototype.hasOwnProperty.call(this._dataMap, item.data)) {
                                const rec = this._dataMap[item.data];
                                tbValue = (rec && (rec.value !== undefined)) ? rec.value : (rec && rec !== undefined ? rec : '');
                            }
                            tb.setText(String(tbValue));
                            tb.setHeight(22);
                            tb.setCaption(caption);
                            tb.Draw(contentArea);
                            // If layout references a data key, set element name so external wiring can find it
                            try { if (item.data && tb.element) tb.element.name = item.data; } catch (e) {}
                            // Make textbox stretch to available width
                            if (tb.element) tb.element.style.width = '100%';
                            if (item.name) controlsMap[item.name] = tb;
                            break;
                        }
                        case 'checkbox': {
                            // Create checkbox as a child of contentArea so it flows below previous elements
                            const cb = new CheckBox(contentArea, properties);
                            // Determine checked state: prefer explicit item.value, fall back to loaded data by item.data
                            let checked = !!item.value;
                            if ((item.value === null || item.value === undefined) && item.data && this._dataMap && Object.prototype.hasOwnProperty.call(this._dataMap, item.data)) {
                                const rec = this._dataMap[item.data];
                                checked = !!(rec && (rec.value !== undefined) ? rec.value : rec);
                            }
                            cb.setChecked(checked);
                            cb.setHeight(22);
                            // Ensure caption is passed to control so FormInput draws label
                            cb.setCaption(caption);
                            cb.Draw(contentArea);
                            // If layout references a data key, set element name so external wiring can find it
                            try { if (item.data && cb.element) cb.element.name = item.data; } catch (e) {}
                            if (item.name) controlsMap[item.name] = cb;
                            break;
                        }
                        case 'group': {
                            // Create group container and recursively render its layout into the group's element
                            const grp = new Group(contentArea, properties);
                            grp.setCaption(caption);
                            if (item.orientation) grp.orientation = item.orientation;
                            grp.Draw(contentArea);
                            if (grp.element && item.layout && Array.isArray(item.layout)) {
                                await this.renderLayout(grp.element, item.layout);
                            }
                            break;
                        }
                        default:
                            console.warn('Unknown layout item type:', item.type);
                    }
                };

                appForm.loadData = async function() {
                    try {
                        const d = await callServerMethod(APP_NAME, 'getData', {});
                        this._dataMap = {};
                        if (d && Array.isArray(d)) {
                            for (const rec of d) {
                                if (rec && rec.name) this._dataMap[rec.name] = rec;
                            }
                        }
                    } catch (e) {
                        this._dataMap = {};
                    }
                };

                appForm.getLayoutWithData = async function() {
                    // Explicit client helper to fetch layout and data atomically from server
                    try {
                        const both = await callServerMethod(APP_NAME, 'getLayoutWithData', {});
                        return both;
                    } catch (err) {
                        throw err;
                    }
                };

                appForm.loadLayout = async function() {
                    // Prefer explicit atomic fetch if server supports it
                    try {
                        const both = await this.getLayoutWithData();
                        if (both && (Array.isArray(both.layout) || Array.isArray(both.data))) {
                            this.layout = Array.isArray(both.layout) ? both.layout : (both.layout && Array.isArray(both.layout.layout) ? both.layout.layout : []);
                            // store datasetId for future changes
                            try { this._datasetId = both.datasetId || null; } catch (e) { this._datasetId = null; }
                            this._dataMap = {};
                            if (both.data && Array.isArray(both.data)) {
                                for (const rec of both.data) {
                                    if (rec && rec.name) this._dataMap[rec.name] = rec;
                                }
                            }
                            this.showLoading = false;
                            return;
                        }
                    } catch (err) {
                        // Combined RPC not available or failed — fallback below
                    }

                    try {
                        const data = await callServerMethod(APP_NAME, 'getLayout', {});
                        // Server may return an array or an object { layout: [...] }
                        if (data && Array.isArray(data)) {
                            this.layout = data;
                        } else if (data && Array.isArray(data.layout)) {
                            this.layout = data.layout;
                        } else {
                            this.layout = [];
                        }
                    } catch (error) {
                        console.error('Ошибка загрузки макета:', error);
                        // If server reports missing method, fall back to empty layout
                        if (error && error.message && error.message.indexOf('Method not found') !== -1) {
                            this.layout = [];
                        }
                        if (typeof showAlert === 'function') showAlert('Ошибка загрузки макета: ' + (error && error.message ? error.message : String(error)));
                    } finally {
                        this.showLoading = false;
                    }
                };

                appForm.applyChanges = async function(changes) {
                    // changes can be any shape the server expects. We include datasetId stored previously.
                    const payload = { datasetId: this._datasetId || null, changes: changes };
                    try {
                        console.log('[recordEditor] Sending applyChanges payload', payload);
                        const res = await callServerMethod(APP_NAME, 'applyChanges', payload);
                        console.log('[recordEditor] applyChanges response', res);
                        return res;
                    } catch (e) {
                        console.error('[recordEditor] applyChanges error', e);
                        throw e;
                    }
                };

                // Preserve original Draw behaviour but scoped to this instance
                const originalDraw = appForm.Draw.bind(appForm);
                appForm.Draw = async function(parent) {
                    originalDraw(parent);
                    const contentArea = this.getContentArea();
                    contentArea.style.display = 'flex';
                    contentArea.style.flexDirection = 'column';
                    contentArea.style.padding = '10px';

                    // Clear previous content and controls before re-rendering layout
                    try {
                        if (contentArea) contentArea.innerHTML = '';
                    } catch (e) {}
                    try {
                        for (const k in controlsMap) { if (Object.prototype.hasOwnProperty.call(controlsMap, k)) delete controlsMap[k]; }
                    } catch (e) {}

                    await appForm.loadLayout();
                    await appForm.renderLayout();

                    // Focus first focusable control inside content area
                    try {
                        setTimeout(() => {
                            try {
                                const selector = 'input, textarea, select, button, [tabindex]';
                                const first = contentArea && contentArea.querySelector ? contentArea.querySelector(selector) : null;
                                if (first && typeof first.focus === 'function') {
                                    first.focus();
                                    // If it's a text input, select its contents
                                    try { if (first.select && first.tagName && first.tagName.toLowerCase() === 'input') first.select(); } catch (e) {}
                                }
                            } catch (e) {}
                        }, 0);
                    } catch (e) {}
                    



                    /*

                    const welcomeText = document.createElement('div');
                    try {
                        welcomeText.textContent = 'Добро пожаловать в приложение ' + APP_NAME + '! Params: ' + (params ? JSON.stringify(params) : 'none');
                    } catch (e) {
                        welcomeText.textContent = 'Добро пожаловать в приложение ' + APP_NAME + '!';
                    }
                    welcomeText.style.fontSize = '18px';
                    welcomeText.style.marginBottom = '20px';
                    contentArea.appendChild(welcomeText);

                    */
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
                    } else if (action === 'save') {
                        // Build changes payload — for now send the full data map back to server
                        const changes = { data: this._dataMap };
                        try {
                            this.applyChanges(changes).then(res => {
                                if (res && res.ok) {
                                    if (typeof showAlert === 'function') showAlert('Данные отправлены');
                                } else {
                                    if (typeof showAlert === 'function') showAlert('Ошибка отправки данных');
                                }
                            }).catch(e => {
                                if (typeof showAlert === 'function') showAlert('Ошибка отправки данных: ' + String(e));
                            });
                        } catch (e) {
                            console.error(e);
                        }
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

        // Register descriptor immediately so MySpace.open can find it synchronously
        if (window.MySpace && typeof window.MySpace.register === 'function') {
            window.MySpace.register(APP_NAME, descriptor);
        } else {
            console.error('Framework registrar window.MySpace.register is not available — please expose it at drive_forms level');
        }

        // Background config fetch disabled: this app works with server-provided
        // settings and the project doesn't host /apps/recordEditor/config.json.
        // If you later want to enable external overrides, restore the fetch
        // from /apps/recordEditor/config.json and merge into `APP_CONFIG`.

        console.log('[' + APP_NAME + '] Client descriptor registered');

    })();
} catch (error) {
    console.error('[recordEditor] Error initializing client descriptor:', error);
}
