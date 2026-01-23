/**
 * Organizations Application - Client Side
 * Displays a dynamic table of organizations
 */

try {
    (function() {
        
        console.log('[organizations] Initializing client...');
        
        // Create main form
        const orgForm = new Form();
        const controlsMap = {};
        orgForm.renderItem = async function(item, contentArea = null) {
            contentArea = contentArea || this.getContentArea();
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
                // Prefer server-provided display text when present
                try {
                    if (item.properties && item.properties.__display !== undefined) {
                        val = item.properties.__display;
                    }
                } catch (e) {}
                try { if (typeof ctrl.setText === 'function') ctrl.setText(String(val)); } catch (e) {}
                // rows support for multiline controls
                try { if (typeof item.rows === 'number' && typeof ctrl.setRows === 'function') ctrl.setRows(item.rows); else if (properties && properties.rows && typeof ctrl.setRows === 'function') ctrl.setRows(properties.rows); } catch (e) {}
                try { if (typeof ctrl.setCaption === 'function') ctrl.setCaption(caption); } catch (e) {}
                ctrl.Draw(contentArea);
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
                    // Prefer server-provided display text when present
                    try { if (item.properties && item.properties.__display !== undefined) val = item.properties.__display; } catch (e) {}

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
                    // Prefer server-provided display text when present
                    try { if (item.properties && item.properties.__display !== undefined) val = item.properties.__display; } catch (e) {}

                    const propClone = Object.assign({}, properties || {}, { readOnly: false });
                    let ctrl = new TextBox(contentArea, propClone);
                    try { if (typeof ctrl.setText === 'function') ctrl.setText(String(val)); } catch (e) {}
                    try { if (typeof ctrl.setCaption === 'function') ctrl.setCaption(caption); } catch (e) {}
                    ctrl.Draw(contentArea);

                    // Use TextBox built-in selection button when requested
                    const propClone2 = Object.assign({}, propClone);
                    if (properties && properties.selection) propClone2.selection = properties.selection;
                    propClone2.showSelectionButton = true;
                    // recreate control with selection properties applied
                    try { if (typeof ctrl.destroy === 'function') ctrl.destroy(); } catch (_) {}
                    const ctrlSel = new TextBox(contentArea, propClone2);
                    try { if (typeof ctrlSel.setText === 'function') ctrlSel.setText(String(val)); } catch (e) {}
                    try { if (typeof ctrlSel.setCaption === 'function') ctrlSel.setCaption(caption); } catch (e) {}
                    try { ctrlSel.Draw(contentArea); } catch (e) { ctrl.Draw(contentArea); }
                    // replace ctrl reference with ctrlSel for downstream wiring
                    ctrl = ctrlSel;

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
                    } catch (e) {}

                    try { if (item.name) controlsMap[item.name] = btn; } catch (e) {}
                    break;
                }
                case 'table': {
                    // Simple table renderer: uses Table UI class which creates a full table
                    try {
                        const tblProps = Object.assign({}, properties || {}, { columns: item.columns || [], dataKey: item.data, appForm: this });
                        console.log('[organizations] creating Table for dataKey=', tblProps.dataKey, 'columns=', (tblProps.columns||[]).length);
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
        orgForm.setTitle('Organizations');
        orgForm.setWidth(900);
        orgForm.setHeight(600);
        orgForm.setX(100);
        orgForm.setY(100);
        
        // Override Draw to add table
        const originalDraw = orgForm.Draw.bind(orgForm);
        orgForm.Draw = function(parent) {
            // Call base implementation
            originalDraw(parent);
            
            const contentArea = this.getContentArea();
            contentArea.style.display = 'flex';
            contentArea.style.flexDirection = 'column';
            
            // Create form toolbar using Toolbar class
            const formToolbar = new Toolbar(contentArea);
            formToolbar.compact = false; // Normal mode: with spacing between buttons
            formToolbar.height = 38;
            
            const refreshBtn = new Button();
            refreshBtn.setCaption('Обновить');
            refreshBtn.setWidth(100);
            refreshBtn.setHeight(28);
            refreshBtn.onClick = () => {
                if (table) {
                    table.refresh();
                }
            };
            formToolbar.addItem(refreshBtn);
            
            const exportBtn = new Button();
            exportBtn.setCaption('Экспорт');
            exportBtn.setWidth(100);
            exportBtn.setHeight(28);
            exportBtn.onClick = () => {
                showAlert('Экспорт будет реализован позже');
            };
            formToolbar.addItem(exportBtn);
            
            const saveBtn = new Button();
            saveBtn.setCaption('Сохранить');
            saveBtn.setIcon('/app/res/public/fontawesome-free-7.1.0-web/svgs/solid/floppy-disk.svg');
            saveBtn.showIcon = true;
            saveBtn.showText = true;
            saveBtn.setTooltip('Сохранить все изменения формы');
            saveBtn.setWidth(100);
            saveBtn.setHeight(28);
            saveBtn.onClick = async () => {
                if (table) {
                    await table.saveChanges();
                }
            };
            formToolbar.addItem(saveBtn);
            
            formToolbar.Draw(contentArea);
            
            // Create table container
            const tableContainer = document.createElement('div');
            tableContainer.style.flex = '1';
            tableContainer.style.position = 'relative';
            tableContainer.style.overflow = 'hidden';
            contentArea.appendChild(tableContainer);
            
            // Create dynamic table
            const table = new DynamicTable({
                appForm: orgForm,
                appName: 'organizations',
                tableName: 'organizations',
                rowHeight: 25,
                multiSelect: false,
                editable: true,  // Enable editing
                showToolbar: true,  // Show table toolbar with standard buttons
                initialSort: [{ field: 'name', order: 'asc' }],
                onRowClick: function(rowData, rowIndex) {
                    console.log('[organizations] Row clicked:', rowData);
                },
                onRowDoubleClick: function(rowData, rowIndex) {
                    console.log('[organizations] Row double-clicked:', rowData);
                    if (typeof showAlert === 'function') {
                        showAlert('Organization: ' + rowData.name + '\n\n' + 
                                  'Description: ' + (rowData.description || 'N/A') + '\n' +
                                  'Active: ' + (rowData.isActive ? 'Yes' : 'No'));
                    }
                },
                onSelectionChanged: function(selectedRows) {
                    console.log('[organizations] Selection changed:', selectedRows.length, 'rows selected');
                }
            });
            
            // Draw table in table container
            table.Draw(tableContainer);
            
            // Store reference
            this.table = table;
        };
        
        // Action handler
        orgForm.doAction = function(action, params) {
            if (action === 'open') {
                // Show form
                orgForm.Draw(document.body);
            } else if (action === 'refresh') {
                // Refresh table
                if (this.table) {
                    this.table.refresh();
                }
            }
        };
        
        // Register app descriptor so MySpace.open can find it
        try {
            if (window.MySpace && typeof window.MySpace.register === 'function') {
                const descriptor = {
                    config: { allowMultipleInstances: true },
                    init() { console.log('[organizations] descriptor initialized'); },
                    async createInstance(params) {
                        const instanceId = 'organizations-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
                        const container = document.createElement('div');
                        container.dataset.instanceId = instanceId;
                        document.body.appendChild(container);
                        const instance = {
                            id: instanceId,
                            appName: 'organizations',
                            container,
                            onOpen(p) { orgForm.Draw(container); },
                            onAction(action, p) {
                                if (action === 'open') orgForm.Draw(container);
                                else if (action === 'refresh' && orgForm.table) orgForm.table.refresh();
                            },
                            destroy() { try { if (orgForm && typeof orgForm.destroy === 'function') orgForm.destroy(); } catch (e) {} try { container.remove(); } catch (e) {} }
                        };
                        return instance;
                    }
                };
                window.MySpace.register('organizations', descriptor);
            } else {
                console.warn('[organizations] MySpace.register is not available');
            }
        } catch (e) {
            console.error('[organizations] Error registering descriptor:', e);
        }

        // Auto-start: draw form on load
        orgForm.Draw(document.body);

        console.log('[organizations] Client initialized successfully');
        
    })();
} catch (e) {
    console.error('[organizations] Client initialization error:', e);
    if (typeof showAlert === 'function') {
        showAlert('Failed to initialize organizations app: ' + e.message);
    }
}
