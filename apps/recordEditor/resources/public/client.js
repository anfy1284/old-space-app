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
                    // Avoid duplicate rendering: if a control for this data key already
                    // exists inside the target container, skip rendering again.
                    try {
                        if (item && item.data && contentArea && contentArea.querySelector && contentArea.querySelector('[data-field="' + item.data + '"]')) {
                            return;
                        }
                    } catch (e) {}
                    let element = null;
                    const properties = item.properties || {};
                    // Allow suppressing captions for embedded controls (e.g., table cells)
                    const caption = (properties && properties.noCaption) ? '' : (item.caption || '');
                    const formThis = this;

                    // Helper to create textbox-like controls (single and multiline)
                        const createTextControl = (ControlCtor) => {
                        const ctrl = new ControlCtor(contentArea, properties);
                        let val = '';
                        if (item.value !== null && item.value !== undefined) val = item.value;
                        else if (item.data && this._dataMap && Object.prototype.hasOwnProperty.call(this._dataMap, item.data)) {
                            const rec = this._dataMap[item.data];
                            val = (rec && (rec.value !== undefined)) ? rec.value : (rec && rec !== undefined ? rec : '');
                        }
                        try { if (typeof ctrl.setText === 'function') ctrl.setText(String(val)); } catch (e) {}
                        // rows support for multiline controls
                        try { if (typeof item.rows === 'number' && typeof ctrl.setRows === 'function') ctrl.setRows(item.rows); else if (properties && properties.rows && typeof ctrl.setRows === 'function') ctrl.setRows(properties.rows); } catch (e) {}
                        try { if (typeof ctrl.setCaption === 'function') ctrl.setCaption(caption); } catch (e) {}
                        ctrl.Draw(contentArea);
                        // Previously we assigned semantic name to the element so external code
                        // could find it via `document.getElementsByName(dataKey)`:
                        // try { if (item.data && ctrl.element) ctrl.element.name = item.data; } catch (e) {}
                        // To avoid browser heuristics we now store the mapping on dataset
                        try { if (item.data && ctrl.element) { ctrl.element.dataset.field = item.data; } } catch (e) {}
                        try { if (ctrl.element) ctrl.element.style.width = '100%'; } catch (e) {}
                        if (item.name) controlsMap[item.name] = ctrl;
                        return ctrl;
                    };

                    switch (item.type) {
                        case 'number': {
                            properties.digitsOnly = true;
                        }
                        case 'textbox': {
                            createTextControl(TextBox);
                            break;
                        }
                        case 'emunList': {
                            // Render a textbox with prepared list options (read-only + dropdown)
                            const dataKey = item.data;
                            let val = '';
                            if (item.value !== null && item.value !== undefined) val = item.value;
                            else if (dataKey && this._dataMap && Object.prototype.hasOwnProperty.call(this._dataMap, dataKey)) {
                                const rec = this._dataMap[dataKey];
                                val = (rec && (rec.value !== undefined)) ? rec.value : (rec && rec !== undefined ? rec : '');
                            }

                            // Gather list items from server-provided record.options or inline item.options
                            let listItems = [];
                            try {
                                if (dataKey && this._dataMap && this._dataMap[dataKey] && Array.isArray(this._dataMap[dataKey].options)) {
                                    listItems = this._dataMap[dataKey].options;
                                } else if (Array.isArray(item.options)) {
                                    listItems = item.options;
                                } else if (properties.listItems && Array.isArray(properties.listItems)) {
                                    listItems = properties.listItems;
                                }
                            } catch (e) { listItems = []; }

                            const propClone = Object.assign({}, properties, { listMode: true, listItems: listItems, readOnly: true });
                            const ctrl = new TextBox(contentArea, propClone);
                            try { if (typeof ctrl.setText === 'function') ctrl.setText(String(val)); } catch (e) {}
                            try { if (typeof ctrl.setCaption === 'function') ctrl.setCaption(caption); } catch (e) {}
                            ctrl.Draw(contentArea);
                            // Sync changes back to this._dataMap when control value changes
                            try {
                                if (item.data) {
                                    const fieldKey = item.data;
                                    const handler = (ev) => {
                                        try {
                                            const newVal = (typeof ctrl.getText === 'function') ? ctrl.getText() : (ctrl.element ? ctrl.element.value : undefined);
                                            if (!this._dataMap) this._dataMap = {};
                                            if (!this._dataMap[fieldKey]) this._dataMap[fieldKey] = { name: fieldKey, value: newVal };
                                            else this._dataMap[fieldKey].value = newVal;
                                        } catch (_) {}
                                    };
                                    try { if (ctrl.element && ctrl.element.addEventListener) ctrl.element.addEventListener('input', handler); } catch (_) {}
                                }
                            } catch (_) {}
                            try { if (item.data && ctrl.element) ctrl.element.dataset.field = item.data; } catch (e) {}
                            if (item.name) controlsMap[item.name] = ctrl;
                            break;
                        }
                        case 'textarea': {
                            createTextControl(MultilineTextBox);
                            break;
                        }
                        case 'recordSelector': {
                            // Render like a textbox but add a small selector button
                            const dataKey = item.data;
                            let val = '';
                            if (item.value !== null && item.value !== undefined) val = item.value;
                            else if (dataKey && this._dataMap && Object.prototype.hasOwnProperty.call(this._dataMap, dataKey)) {
                                const rec = this._dataMap[dataKey];
                                // If stored value is an object, show displayField if available
                                if (rec && typeof rec.value === 'object' && rec.value !== null) {
                                    const disp = (rec.value && rec.value.name) || (rec.value && rec.value.id) || '';
                                    val = disp;
                                } else {
                                    val = (rec && (rec.value !== undefined)) ? rec.value : (rec && rec !== undefined ? rec : '');
                                }
                            }

                            // Prepare properties and create a single TextBox instance.
                            // If selection metadata provided, create control with selection button
                            const baseProps = Object.assign({}, properties || {}, { readOnly: false });
                            const hasSelection = !!(properties && properties.selection);
                            const finalProps = Object.assign({}, baseProps);
                            if (hasSelection) {
                                finalProps.selection = properties.selection;
                                finalProps.showSelectionButton = true;
                            }
                            let ctrl = new TextBox(contentArea, finalProps);
                            try { if (typeof ctrl.setText === 'function') ctrl.setText(String(val)); } catch (e) {}
                            try { if (typeof ctrl.setCaption === 'function') ctrl.setCaption(caption); } catch (e) {}
                            try { ctrl.Draw(contentArea); } catch (e) {}

                            // Sync changes back to this._dataMap when control value changes
                            try {
                                if (item.data) {
                                    const fieldKey = item.data;
                                    const handler = (ev) => {
                                        try {
                                            const newVal = (typeof ctrl.getText === 'function') ? ctrl.getText() : (ctrl.element ? ctrl.element.value : undefined);
                                            if (!this._dataMap) this._dataMap = {};
                                            if (!this._dataMap[fieldKey]) this._dataMap[fieldKey] = { name: fieldKey, value: newVal };
                                            else this._dataMap[fieldKey].value = newVal;
                                        } catch (_) {}
                                    };
                                    try { if (ctrl.element && ctrl.element.addEventListener) ctrl.element.addEventListener('input', handler); } catch (_) {}
                                }
                            } catch (_) {}

                            try { if (item.data && ctrl.element) ctrl.element.dataset.field = item.data; } catch (e) {}
                            if (item.name) controlsMap[item.name] = ctrl;
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
                            // (historically we set `cb.element.name = item.data`, leaving commented for safety)
                            // try { if (item.data && cb.element) cb.element.name = item.data; } catch (e) {}
                            try { if (item.data && cb.element) cb.element.dataset.field = item.data; } catch (e) {}
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
                        case 'button': {
                            // Create a button control and wire its action to the form
                            // Button may be constructed either with no args or with (parent, properties)
                            let btn = null;
                            try {
                                if (typeof Button === 'function') {
                                    try { btn = new Button(contentArea, properties); } catch (e) { btn = new Button(); }
                                }
                            } catch (e) { btn = null; }

                            if (!btn) {
                                console.warn('Button control is not available');
                                break;
                            }

                            try { if (typeof btn.setCaption === 'function') btn.setCaption(caption); } catch (e) {}
                            try { if (properties && properties.width && typeof btn.setWidth === 'function') btn.setWidth(properties.width); } catch (e) {}
                            try { if (properties && properties.height && typeof btn.setHeight === 'function') btn.setHeight(properties.height); } catch (e) {}

                            // Draw into content area
                            try { if (typeof btn.Draw === 'function') btn.Draw(contentArea); else if (btn.element && contentArea.appendChild) contentArea.appendChild(btn.element); } catch (e) {}

                            // Wire click/action to form.doAction
                            try {
                                const action = item.action;
                                const params = item.params || {};
                                // Prefer onClick property if supported by Button implementation
                                btn.onClick = function(ev) {
                                    try { if (action && formThis && typeof formThis.doAction === 'function') formThis.doAction(action, params); } catch (e) {}
                                };
                                // Some Button implementations expect to call global handler name, ensure closure has reference
                            } catch (e) {}

                            // Keep reference in controls map
                            try { if (item.name) controlsMap[item.name] = btn; } catch (e) {}
                            break;
                        }
                        case 'table': {
                            // Simple table renderer: uses Table UI class which creates a full table
                            try {
                                const tblProps = Object.assign({}, properties || {}, { columns: item.columns || [], dataKey: item.data, appForm: this });
                                console.log('[recordEditor] creating Table for dataKey=', tblProps.dataKey, 'columns=', (tblProps.columns||[]).length);
                                // Always use the lightweight Table UI class (styled like DynamicTable)
                                const tbl = new Table(contentArea, tblProps);
                                try { if (typeof tbl.setCaption === 'function') tbl.setCaption(caption); } catch (e) {}
                                try { if (typeof tbl.Draw === 'function') tbl.Draw(contentArea); } catch (e) {}
                                if (item.name) controlsMap[item.name] = tbl;
                            } catch (e) {
                                console.error('Error creating table control', e);
                            }
                            break;
                        }
                        case 'tabs': {
                            try {
                                // Create Tabs like other controls: new Tabs(parent, properties)
                                let tabsCtrl = null;
                                try { tabsCtrl = new Tabs(contentArea, { tabs: item.tabs || [], appForm: this }); } catch (e) {
                                    // Fallback to UI_Classes.Tabs if global Tabs isn't available
                                    const TabsClass = (window.UI_Classes && window.UI_Classes.Tabs) ? window.UI_Classes.Tabs : null;
                                    if (!TabsClass) throw new Error('Tabs control is not available');
                                    tabsCtrl = new TabsClass(contentArea, { tabs: item.tabs || [], appForm: this });
                                }
                                try { if (typeof tabsCtrl.setCaption === 'function') tabsCtrl.setCaption(caption); } catch (e) {}
                                try { if (typeof tabsCtrl.Draw === 'function') tabsCtrl.Draw(contentArea); } catch (e) {}
                                if (item.name) controlsMap[item.name] = tabsCtrl;
                            } catch (e) {
                                console.error('Error creating tabs control', e);
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
