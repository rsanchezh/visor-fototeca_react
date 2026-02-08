
// Initialize App when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM Content Loaded - main.js executing');

    // Initialize Filter Toggle (Independent of App)
    const filtersToggle = document.getElementById('filtersToggle');
    const filtersBody = document.getElementById('filtersBody');

    console.log('🔍 Looking for filter elements...');
    console.log('  filtersToggle:', filtersToggle);
    console.log('  filtersBody:', filtersBody);

    if (filtersToggle && filtersBody) {
        console.log('✅ Filter toggle initialized');
        filtersToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Filter toggle clicked');
            console.log('  Before - filtersBody classes:', filtersBody.className);
            console.log('  Before - filtersToggle classes:', filtersToggle.className);

            filtersBody.classList.toggle('collapsed');
            filtersToggle.classList.toggle('collapsed');

            console.log('  After - filtersBody classes:', filtersBody.className);
            console.log('  After - filtersToggle classes:', filtersToggle.className);
        });
    } else {
        console.warn('❌ Filter toggle elements not found');
        console.warn('  Missing:', !filtersToggle ? 'filtersToggle' : 'filtersBody');
    }

    // Initialize Main Sidebar Collapse (Entire Panel)
    const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
    const sidebarExpandBtn = document.getElementById('sidebarExpandBtn');
    const mainContainer = document.querySelector('.main-container');

    if (sidebarCollapseBtn && sidebarExpandBtn && mainContainer) {
        console.log('✅ Sidebar collapse initialized');

        // Collapse Sidebar
        sidebarCollapseBtn.addEventListener('click', () => {
            mainContainer.classList.add('sidebar-collapsed');
            sidebarExpandBtn.classList.remove('hidden');

            // Force map resize update after transition
            setTimeout(() => {
                if (window.app && window.app.mapeaController && window.app.mapeaController.map) {
                    // Trigger Mapea to recalculate map size
                    const map = window.app.mapeaController.map;
                    map.refresh(); // Mapea method to refresh map
                    // Also try OpenLayers updateSize as fallback
                    if (map.getMapImpl && map.getMapImpl()) {
                        map.getMapImpl().updateSize();
                    }
                }
            }, 400);
        });

        // Expand Sidebar
        sidebarExpandBtn.addEventListener('click', () => {
            mainContainer.classList.remove('sidebar-collapsed');
            sidebarExpandBtn.classList.add('hidden');

            // Force map resize update after transition
            setTimeout(() => {
                if (window.app && window.app.mapeaController && window.app.mapeaController.map) {
                    // Trigger Mapea to recalculate map size
                    const map = window.app.mapeaController.map;
                    map.refresh(); // Mapea method to refresh map
                    // Also try OpenLayers updateSize as fallback
                    if (map.getMapImpl && map.getMapImpl()) {
                        map.getMapImpl().updateSize();
                    }
                }
            }, 400);
        });
    }

    try {
        console.log('🚀 Initializing App...');
        window.app = new App();
    } catch (error) {
        console.error('Failed to initialize App:', error);
    }
});
