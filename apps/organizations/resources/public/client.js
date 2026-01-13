/**
 * Organizations Application - Client Side
 * Displays a dynamic table of organizations
 */

try {
    (function() {
        
        console.log('[organizations] Initializing client...');
        
        // Create main form
        const orgForm = new Form();
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
