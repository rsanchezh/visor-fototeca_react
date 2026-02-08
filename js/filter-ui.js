// Filter UI Controller - Manages filter controls and flight list
class FilterUI {
    constructor(ckanService, onFilterChange, onFlightSelect, onShowInfo) {
        this.ckanService = ckanService;
        this.onFilterChange = onFilterChange;
        this.onFlightSelect = onFlightSelect;
        this.onShowInfo = onShowInfo;
        this.selectedFlightName = null;

        // Get DOM elements
        this.elements = {
            textSearch: document.getElementById('filterTextSearch'),
            tipoVuelo: document.getElementById('filterTipoVuelo'),
            tipologia: document.getElementById('filterTipologia'),
            color: document.getElementById('filterColor'),
            yearFrom: document.getElementById('filterYearFrom'),
            yearTo: document.getElementById('filterYearTo'),
            applyButton: document.getElementById('applyFilters'),
            resetButton: document.getElementById('resetFilters'),
            resultsCount: document.getElementById('resultsCount'),
            flightListItems: document.getElementById('flightListItems')
        };

        this.setupEventListeners();
    }

    /**
     * Initialize filter options from data
     */
    initialize() {
        const options = this.ckanService.getFilterOptions();

        // Populate flight type filter
        this.populateSelect(this.elements.tipoVuelo, options.tipoVuelo);

        // Populate typology filter
        this.populateSelect(this.elements.tipologia, options.tipologia);

        // Populate color filter
        this.populateSelect(this.elements.color, options.color);

        // Set year range placeholders
        if (options.yearMin && options.yearMax) {
            this.elements.yearFrom.placeholder = options.yearMin.toString();
            this.elements.yearTo.placeholder = options.yearMax.toString();
            this.elements.yearFrom.min = options.yearMin;
            this.elements.yearFrom.max = options.yearMax;
            this.elements.yearTo.min = options.yearMin;
            this.elements.yearTo.max = options.yearMax;
        }

        // Display initial flight list
        this.updateFlightList(this.ckanService.getAllFlights());
    }

    /**
     * Populate a select element with options
     */
    populateSelect(selectElement, options) {
        // Clear existing options except the first one (default)
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }

        // Add new options
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Text search with debounce (wait 500ms after user stops typing)
        let searchTimeout;
        this.elements.textSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.applyFilters(), 500);
        });

        // Enter key on text search
        this.elements.textSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                this.applyFilters();
            }
        });

        // Apply filters button
        this.elements.applyButton.addEventListener('click', () => {
            this.applyFilters();
        });

        // Reset filters button
        this.elements.resetButton.addEventListener('click', () => {
            this.resetFilters();
        });

        // Enter key on year inputs
        this.elements.yearFrom.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });

        this.elements.yearTo.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });
    }

    /**
     * Apply filters
     */
    applyFilters() {
        const filters = {
            textSearch: this.elements.textSearch.value.trim(),
            tipoVuelo: this.elements.tipoVuelo.value,
            tipologia: this.elements.tipologia.value,
            color: this.elements.color.value,
            yearFrom: this.elements.yearFrom.value,
            yearTo: this.elements.yearTo.value
        };

        const filteredFlights = this.ckanService.applyFilters(filters);
        this.updateFlightList(filteredFlights);

        if (this.onFilterChange) {
            this.onFilterChange(filteredFlights);
        }
    }

    /**
     * Reset all filters
     */
    resetFilters() {
        this.elements.textSearch.value = '';
        this.elements.tipoVuelo.value = '';
        this.elements.tipologia.value = '';
        this.elements.color.value = '';
        this.elements.yearFrom.value = '';
        this.elements.yearTo.value = '';

        this.applyFilters();
    }

    /**
     * Update flight list display
     */
    updateFlightList(flights) {
        // Update results count
        this.elements.resultsCount.textContent = `${flights.length} vuelo${flights.length !== 1 ? 's' : ''} encontrado${flights.length !== 1 ? 's' : ''}`;

        // Clear existing list
        this.elements.flightListItems.innerHTML = '';

        // Sort flights alphabetically by title
        flights.sort((a, b) => {
            const titleA = (a.title || a.name || '').toLowerCase();
            const titleB = (b.title || b.name || '').toLowerCase();
            return titleA.localeCompare(titleB, 'es', { sensitivity: 'base' });
        });

        // Add flight items
        flights.forEach(flight => {
            const item = this.createFlightItem(flight);
            this.elements.flightListItems.appendChild(item);
        });
    }

    /**
     * Create a flight list item element
     */
    createFlightItem(flight) {
        const item = document.createElement('div');
        item.className = 'flight-item';
        item.dataset.flightName = flight.name;

        const title = document.createElement('div');
        title.className = 'flight-item-title';
        title.textContent = flight.title;

        const meta = document.createElement('div');
        meta.className = 'flight-item-meta';

        // Add metadata badges
        const badges = [];
        if (flight.year) badges.push(`<span class="flight-item-badge">${flight.year}</span>`);
        if (flight.color) badges.push(`<span class="flight-item-badge">${flight.color}</span>`);
        if (flight.escala) badges.push(`<span class="flight-item-badge">1:${flight.escala}</span>`);
        if (flight.numFotogramas) badges.push(`<span class="flight-item-badge">${flight.numFotogramas} fotogramas</span>`);

        meta.innerHTML = badges.join('');

        // Create info button
        const infoBtn = document.createElement('button');
        infoBtn.className = 'flight-info-btn';
        infoBtn.title = 'Ver información del vuelo';
        infoBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        `;
        infoBtn.style.cssText = `
            background: none; 
            border: none; 
            color: #94a3b8; 
            cursor: pointer; 
            padding: 4px;
            margin-right: -4px;
            display: flex;
            align-items: center;
        `;
        infoBtn.querySelector('svg').style.cssText = 'width: 20px; height: 20px;';

        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Don't select the flight
            if (this.onShowInfo) {
                this.onShowInfo(flight);
            }
        });

        // Add hover effect via JS since it's inline for now (or could add to CSS)
        infoBtn.onmouseover = () => infoBtn.style.color = '#3b82f6';
        infoBtn.onmouseout = () => infoBtn.style.color = '#94a3b8';

        const headerRow = document.createElement('div');
        headerRow.style.cssText = 'display: flex; justify-content: space-between; align-items: start; gap: 8px;';

        headerRow.appendChild(title);
        headerRow.appendChild(infoBtn);

        item.appendChild(headerRow);
        item.appendChild(meta);

        // Add click handler
        item.addEventListener('click', () => {
            this.selectFlight(flight.name);
        });

        return item;
    }

    /**
     * Select a flight
     */
    selectFlight(flightName) {
        // Remove active class from all items
        document.querySelectorAll('.flight-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to selected item
        const selectedItem = document.querySelector(`[data-flight-name="${flightName}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }

        this.selectedFlightName = flightName;

        // Get flight data
        const flight = this.ckanService.getFlightByName(flightName);

        if (flight && this.onFlightSelect) {
            this.onFlightSelect(flight);
        }
    }

    /**
     * Get currently selected flight name
     */
    getSelectedFlightName() {
        return this.selectedFlightName;
    }
}
