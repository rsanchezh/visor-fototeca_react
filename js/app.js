// Main Application Controller
class App {
    constructor() {
        this.ckanService = new CKANService();
        this.mapeaController = new MAPEAController();
        this.filterUI = null;
        this.activeLayersUI = null;
        this.photoViewer = new PhotoViewer();

        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.mapInfoPanel = document.getElementById('mapInfoPanel');
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            this.showLoading('Inicializando mapa...');

            // Initialize MAPEA4 map
            const mapInitialized = this.mapeaController.initialize();
            if (!mapInitialized) {
                throw new Error('Error al inicializar el mapa MAPEA4');
            }

            this.showLoading('Cargando datos de vuelos...');

            // Fetch flights from CKAN
            await this.ckanService.fetchFlights();

            // Initialize filter UI
            this.filterUI = new FilterUI(
                this.ckanService,
                (filteredFlights) => this.onFilterChange(filteredFlights),
                (flight) => this.onFlightSelect(flight),
                (flight) => {
                    // onShowInfo callback
                    if (this.activeLayersUI) {
                        this.activeLayersUI.showFlightInfo(flight);
                    } else {
                        console.warn('ActiveLayersUI not initialized yet');
                    }
                }
            );

            this.filterUI.initialize();

            // Initialize active layers UI
            this.activeLayersUI = new ActiveLayersUI(this.mapeaController, this.ckanService);

            // Setup map click handler
            this.mapeaController.onFeatureClick((properties) => {
                this.onFeatureClick(properties);
            });

            this.hideLoading();
            this.showInfoPanel();

            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
            this.showError('Error al inicializar la aplicación: ' + error.message);
        }

    }

    /**
     * Handle filter change
     */
    onFilterChange(filteredFlights) {
        console.log('Filters applied:', filteredFlights.length, 'flights');

        // If a flight was selected and it's no longer in filtered results, clear the map
        const currentFlight = this.mapeaController.getCurrentFlight();
        if (currentFlight) {
            const stillVisible = filteredFlights.find(f => f.name === currentFlight.name);
            if (!stillVisible) {
                this.mapeaController.clearLayers();
                this.showInfoPanel();
            }
        }
    }

    /**
     * Handle flight selection
     */
    async onFlightSelect(flight) {
        try {
            this.showLoading(`Cargando vuelo: ${flight.title}...`);
            this.hideInfoPanel();

            // Load flight layers on map
            const success = await this.mapeaController.loadFlightLayers(flight);

            if (!success) {
                throw new Error('Error al cargar las capas del vuelo');
            }

            this.hideLoading();

            this.hideLoading();

            // Collapse filters section when a flight is selected
            const filtersBody = document.getElementById('filtersBody');
            const filtersToggle = document.getElementById('filtersToggle');
            if (filtersBody) {
                filtersBody.classList.add('collapsed');
                if (filtersToggle) filtersToggle.classList.add('collapsed');
            }

            console.log('Flight selected:', flight.name);
        } catch (error) {
            console.error('Error loading flight:', error);
            this.showError('Error al cargar el vuelo: ' + error.message);
        }
    }

    /**
     * Handle feature click on map - Load WMS service
     */
    async onFeatureClick(properties) {
        console.log('Feature clicked:', properties);

        const currentFlight = this.mapeaController.getCurrentFlight();
        if (!currentFlight) {
            console.warn('No current flight selected');
            return;
        }

        // Load WMS service for the photograph (wait for it to complete)
        const success = await this.mapeaController.loadPhotoWMS(properties);

        // Update active layers UI after layer is added/removed
        if (this.activeLayersUI) {
            this.activeLayersUI.updateLayersList();
        }

        if (success) {
            console.log('WMS service loaded for photograph:', properties.id_fotogra || properties.fotogramas);
        } else {
            console.error('Failed to load WMS service for photograph');
        }
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Cargando...') {
        if (this.loadingOverlay) {
            const loadingText = this.loadingOverlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
            this.loadingOverlay.classList.remove('hidden');
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    /**
     * Show info panel
     */
    showInfoPanel() {
        if (this.mapInfoPanel) {
            this.mapInfoPanel.classList.remove('hidden');
        }
    }

    /**
     * Hide info panel
     */
    hideInfoPanel() {
        if (this.mapInfoPanel) {
            this.mapInfoPanel.classList.add('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.hideLoading();

        if (this.loadingOverlay) {
            this.loadingOverlay.innerHTML = `
                <div style="text-align: center; color: var(--text-primary);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; color: #ef4444; margin-bottom: 1rem;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p style="font-size: 1rem; margin-bottom: 0.5rem;">Error</p>
                    <p style="font-size: 0.875rem; color: var(--text-secondary);">${message}</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-color); border: none; border-radius: 0.5rem; color: white; cursor: pointer;">
                        Recargar página
                    </button>
                </div>
            `;
            this.loadingOverlay.classList.remove('hidden');
        }
    }
}

// Initialize application when DOM is ready
// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize App Class
    try {
        const app = new App();
        app.initialize();
        window.app = app; // Expose for debugging
    } catch (e) {
        console.error('❌ Failed to init app:', e);
    }
});
