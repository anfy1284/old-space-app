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
            
            // Create dynamic table
            const table = new DynamicTable({
                appName: 'organizations',
                tableName: 'organizations',
                rowHeight: 25,
                multiSelect: false,
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
            
            // Draw table in content area
            table.Draw(contentArea);
            
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
