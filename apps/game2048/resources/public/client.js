

try {
    (function(){

        loadResource('apps/game2048/resources/public/style/main.css', 'style');

        loadResource('apps/game2048/resources/public/js/bind_polyfill.js', 'script');
        loadResource('apps/game2048/resources/public/js/classlist_polyfill.js', 'script');
        loadResource('apps/game2048/resources/public/js/animframe_polyfill.js', 'script');
        loadResource('apps/game2048/resources/public/js/keyboard_input_manager.js', 'script');
        loadResource('apps/game2048/resources/public/js/html_actuator.js', 'script');
        loadResource('apps/game2048/resources/public/js/grid.js', 'script');
        loadResource('apps/game2048/resources/public/js/tile.js', 'script');
        loadResource('apps/game2048/resources/public/js/local_storage_manager.js', 'script');
        loadResource('apps/game2048/resources/public/js/game_manager.js', 'script');
        loadResource('apps/game2048/resources/public/js/application.js', 'script');

        const formCalc = new Form();
        formCalc.setTitle('2048');
        formCalc.setX(300);
        formCalc.setY(300);
        formCalc.setWidth(500);
        formCalc.setHeight(300);
        formCalc.setAnchorToWindow('center');

        formCalc.Draw = function (parent) {
            // Call base implementation
            Form.prototype.Draw.call(this, parent);

            contentArea = this.getContentArea();
            contentArea.classList.add('game2048');
            loadHTMLContent('apps/game2048/resources/public/index.html')
                .then((html) => {
                    contentArea.innerHTML = html;
                    // Delay sizing to allow browser to layout new content (images/fonts)
                    try {
                        setTimeout(() => {
                            try {
                                this.setSizeToContent();
                            } catch (e) {
                                // ignore if Form helper not available
                            }
                        }, 50);
                    } catch (e) {
                        // ignore
                    }
                })
                .catch(function(err){
                    try {
                        showAlert('Failed to load game content: ' + err.message);
                    } catch (e) {
                        contentArea.innerHTML = '<p style="color: red;">Failed to load game content: ' + err.message + '</p>';
                    }
                });
        };


        formCalc.doAction = function (action, params) {
            if (action === 'open') {
                // Show calculator form
                formCalc.Draw(document.body);
            }
        };
        formCalc.Draw(document.body);
    })();
} catch (e) {
    // Fallback if framework UI classes (Form, Button, TextBox) are not available
    try {
        showAlert(e.message);
    } catch (ee) {
        // If even DOM is not available (e.g., running under Node), silently ignore
        // eslint-disable-next-line no-empty
    }
}