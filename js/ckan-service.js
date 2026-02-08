// CKAN Service - Handles data fetching and filtering from CKAN API
class CKANService {
    constructor() {
        this.flights = [];
        this.filteredFlights = [];
        this.filterOptions = {
            tipoVuelo: [],
            tipologia: [],
            color: [],
            yearMin: null,
            yearMax: null
        };
    }

    /**
     * Normalize text: remove accents and convert to lowercase
     * Cádiz, CADIZ, cadiz all become "cadiz"
     */
    normalizeText(text) {
        if (!text) return '';
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')  // Decompose accented characters
            .replace(/[\u0300-\u036f]/g, '');  // Remove diacritics
    }

    /**
     * Fetch all photogrammetric flights from CKAN API
     */
    async fetchFlights() {
        try {
            const url = `${CONFIG.CKAN.BASE_URL}${CONFIG.CKAN.ENDPOINTS.PACKAGE_SEARCH}?q=groups:${CONFIG.CKAN.GROUPS.FLIGHTS}&rows=${CONFIG.CKAN.MAX_ROWS}&fq=vocab_publicado:True`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error('CKAN API returned error');
            }

            this.flights = data.result.results.map(pkg => this.parseFlightData(pkg));
            this.filteredFlights = [...this.flights];
            this.buildFilterOptions();

            console.log(`Loaded ${this.flights.length} published flights from CKAN`);
            return this.flights;
        } catch (error) {
            console.error('Error fetching flights:', error);
            throw error;
        }
    }

    /**
     * Parse flight package data from CKAN
     */
    parseFlightData(pkg) {
        const extras = {};
        pkg.extras.forEach(extra => {
            extras[extra.key] = extra.value;
        });

        // Extract WFS service URLs
        const wfsResource = pkg.resources.find(r => r.mimetype === 'WFS');
        const centroidResource = pkg.resources.find(r =>
            r.mimetype === 'geojson' && r.name.includes('centroide')
        );
        const footprintResource = pkg.resources.find(r =>
            r.mimetype === 'geojson' && r.name.includes('huella_fotogramas')
        );
        const pngResource = pkg.resources.find(r =>
            (r.mimetype && r.mimetype.includes('png')) ||
            (r.format && r.format.toLowerCase().includes('png'))
        );
        // User specified mimetype "JPEG20000" (likely a typo in CKAN or specific tag) for downloads
        const downloadResource = pkg.resources.find(r =>
            (r.mimetype && (r.mimetype === 'JPEG20000' || r.mimetype.includes('jpeg') || r.mimetype.includes('jp2'))) ||
            (r.format && (r.format === 'JPEG20000' || r.format.toLowerCase().includes('jpeg')))
        );

        return {
            id: pkg.id,
            name: pkg.name,
            title: pkg.title,
            description: pkg.notes,
            extras: extras,
            resources: pkg.resources,
            wfsUrl: wfsResource ? wfsResource.url.split('?')[0] : null,
            centroidUrl: centroidResource ? centroidResource.url : null,
            footprintUrl: footprintResource ? footprintResource.url : null,
            pngUrl: pngResource ? pngResource.url : null,
            downloadUrl: downloadResource ? downloadResource.url : null,
            // Parsed fields for easy access
            tipoVuelo: extras[CONFIG.FILTER_FIELDS.FLIGHT_TYPE] || '',
            tipologia: extras[CONFIG.FILTER_FIELDS.TYPOLOGY] || '',
            color: extras[CONFIG.FILTER_FIELDS.COLOR] || '',
            year: extras[CONFIG.FILTER_FIELDS.YEAR] || '',
            escala: extras[CONFIG.FILTER_FIELDS.SCALE] || '',
            idVuelo: extras[CONFIG.FILTER_FIELDS.FLIGHT_ID] || '',
            numFotogramas: extras[CONFIG.FILTER_FIELDS.NUM_FRAMES] || '0'
        };
    }

    /**
     * Build filter options from all flights
     */
    buildFilterOptions() {
        this.filterOptions = {
            tipoVuelo: new Set(),
            tipologia: new Set(),
            color: new Set(),
            years: { min: Infinity, max: -Infinity }
        };

        this.flights.forEach(flight => {
            if (flight.tipoVuelo) this.filterOptions.tipoVuelo.add(flight.tipoVuelo);
            if (flight.tipologia) this.filterOptions.tipologia.add(flight.tipologia);
            if (flight.color) this.filterOptions.color.add(flight.color);

            if (flight.year) {
                const year = parseInt(flight.year);
                if (!isNaN(year)) {
                    this.filterOptions.years.min = Math.min(this.filterOptions.years.min, year);
                    this.filterOptions.years.max = Math.max(this.filterOptions.years.max, year);
                }
            }
        });
    }

    /**
     * Apply filters to flights
     */
    applyFilters(filters) {
        this.filteredFlights = this.flights.filter(flight => {
            // Filter by text search (search in title, description, and all extras)
            if (filters.textSearch) {
                const searchTerm = this.normalizeText(filters.textSearch);

                // Search in title
                const titleMatch = this.normalizeText(flight.title).includes(searchTerm);

                // Search in description
                const descMatch = this.normalizeText(flight.description).includes(searchTerm);

                // Search in all extras values
                const extrasMatch = Object.values(flight.extras).some(value =>
                    this.normalizeText(value).includes(searchTerm)
                );

                // If none match, exclude this flight
                if (!titleMatch && !descMatch && !extrasMatch) {
                    return false;
                }
            }

            // Filter by flight type
            if (filters.tipoVuelo && flight.tipoVuelo !== filters.tipoVuelo) {
                return false;
            }

            // Filter by typology
            if (filters.tipologia && flight.tipologia !== filters.tipologia) {
                return false;
            }

            // Filter by color
            if (filters.color && flight.color !== filters.color) {
                return false;
            }

            // Filter by year range
            if (filters.yearFrom || filters.yearTo) {
                const year = parseInt(flight.year);
                if (isNaN(year)) return false;

                if (filters.yearFrom && year < parseInt(filters.yearFrom)) {
                    return false;
                }

                if (filters.yearTo && year > parseInt(filters.yearTo)) {
                    return false;
                }
            }

            return true;
        });

        return this.filteredFlights;
    }

    /**
     * Get filtered flights
     */
    getFilteredFlights() {
        return this.filteredFlights;
    }

    /**
     * Get all flights
     */
    getAllFlights() {
        return this.flights;
    }

    /**
     * Get filter options
     */
    getFilterOptions() {
        return {
            tipoVuelo: Array.from(this.filterOptions.tipoVuelo).sort(),
            tipologia: Array.from(this.filterOptions.tipologia).sort(),
            color: Array.from(this.filterOptions.color).sort(),
            yearMin: this.filterOptions.years.min !== Infinity ? this.filterOptions.years.min : null,
            yearMax: this.filterOptions.years.max !== -Infinity ? this.filterOptions.years.max : null
        };
    }

    /**
     * Get flight by name
     */
    getFlightByName(name) {
        return this.flights.find(f => f.name === name);
    }

    /**
     * Build WFS URL for a flight
     */
    buildWFSUrl(flight, typename) {
        if (!flight.wfsUrl) return null;

        const params = new URLSearchParams({
            service: 'WFS',
            version: CONFIG.WFS.VERSION,
            request: 'GetFeature',
            typename: typename,
            outputFormat: CONFIG.WFS.OUTPUT_FORMAT,
            srsName: CONFIG.WFS.SRS_NAME
        });

        return `${flight.wfsUrl}?${params.toString()}`;
    }

    /**
     * Fetch individual package data from CKAN by ID
     * Transforms WFS ID format (e.g., "182-12345") to CKAN format (e.g., "182_12345")
     */
    async fetchPackageById(fotogramaId) {
        try {
            // Transform ID: "182-12345" -> "182_12345" and ensure lowercase
            const ckanId = fotogramaId.replace(/-/, '_').toLowerCase();

            const url = `${CONFIG.CKAN.API_URL}/package_show?id=${ckanId}`;
            console.log('📦 Fetching CKAN package:', ckanId, 'URL:', url);

            const response = await fetch(url);
            const data = await response.json();

            if (!data.success) {
                console.error('❌ CKAN API error:', data.error);
                throw new Error(`CKAN API error: ${data.error?.message || 'Unknown error'}`);
            }

            console.log('✅ CKAN package received:', data.result.name);
            console.log('📋 Resources found:', data.result.resources.length);

            // Log all resources for debugging
            data.result.resources.forEach((r, idx) => {
                console.log(`  Resource ${idx}: mimetype="${r.mimetype}", format="${r.format}", name="${r.name}"`);
            });

            // Find JPEG20000 resource - try multiple strategies
            let jpeg2000Resource = data.result.resources.find(r => r.mimetype === 'JPEG20000');

            if (!jpeg2000Resource) {
                console.warn('⚠️ No exact JPEG20000 mimetype, trying alternatives...');
                jpeg2000Resource = data.result.resources.find(r =>
                    (r.mimetype && r.mimetype.includes('JPEG')) ||
                    (r.format && r.format.includes('JPEG')) ||
                    (r.mimetype && r.mimetype.includes('jp2')) ||
                    (r.format && r.format.toLowerCase().includes('jp2'))
                );
            }

            if (jpeg2000Resource) {
                console.log('✅ Found download resource:', jpeg2000Resource.name, 'URL:', jpeg2000Resource.url);
            } else {
                console.error('❌ No JPEG2000 resource found in package');
            }

            // Log extras if available
            if (data.result.extras) {
                console.log('📋 Extras found:', data.result.extras.length);
            }

            return {
                id: data.result.id,
                name: data.result.name,
                downloadUrl: jpeg2000Resource ? jpeg2000Resource.url : null,
                resources: data.result.resources,
                extras: data.result.extras // Include extras in return
            };
        } catch (error) {
            console.error('❌ Error fetching package from CKAN:', error);
            return null;
        }
    }
}
