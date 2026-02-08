import { CONFIG } from '../config';

export class CKANService {
  constructor() {
    this.flights = [];
    this.filteredFlights = [];
    this.filterOptions = {
      tipoVuelo: new Set(),
      tipologia: new Set(),
      color: new Set(),
      years: { min: Infinity, max: -Infinity }
    };
  }

  normalizeText(text) {
    if (!text) return '';
    return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  async fetchFlights() {
    const url = `${CONFIG.CKAN.BASE_URL}${CONFIG.CKAN.ENDPOINTS.PACKAGE_SEARCH}?q=groups:${CONFIG.CKAN.GROUPS.FLIGHTS}&rows=${CONFIG.CKAN.MAX_ROWS}&fq=vocab_publicado:True`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('CKAN API returned error');
    this.flights = data.result.results.map((pkg) => this.parseFlightData(pkg));
    this.filteredFlights = [...this.flights];
    this.buildFilterOptions();
    return this.flights;
  }

  parseFlightData(pkg) {
    const extras = {};
    pkg.extras.forEach((extra) => { extras[extra.key] = extra.value; });
    const wfsResource = pkg.resources.find((r) => r.mimetype === 'WFS');
    const centroidResource = pkg.resources.find((r) => r.mimetype === 'geojson' && r.name.includes('centroide'));
    const footprintResource = pkg.resources.find((r) => r.mimetype === 'geojson' && r.name.includes('huella_fotogramas'));
    const pngResource = pkg.resources.find((r) => (r.mimetype && r.mimetype.includes('png')) || (r.format && r.format.toLowerCase().includes('png')));
    const downloadResource = pkg.resources.find((r) =>
      (r.mimetype && (r.mimetype === 'JPEG20000' || r.mimetype.includes('jpeg') || r.mimetype.includes('jp2'))) ||
      (r.format && (r.format === 'JPEG20000' || r.format.toLowerCase().includes('jpeg')))
    );
    return {
      id: pkg.id,
      name: pkg.name,
      title: pkg.title,
      description: pkg.notes,
      extras,
      resources: pkg.resources,
      wfsUrl: wfsResource ? wfsResource.url.split('?')[0] : null,
      centroidUrl: centroidResource ? centroidResource.url : null,
      footprintUrl: footprintResource ? footprintResource.url : null,
      pngUrl: pngResource ? pngResource.url : null,
      downloadUrl: downloadResource ? downloadResource.url : null,
      tipoVuelo: extras[CONFIG.FILTER_FIELDS.FLIGHT_TYPE] || '',
      tipologia: extras[CONFIG.FILTER_FIELDS.TYPOLOGY] || '',
      color: extras[CONFIG.FILTER_FIELDS.COLOR] || '',
      year: extras[CONFIG.FILTER_FIELDS.YEAR] || '',
      escala: extras[CONFIG.FILTER_FIELDS.SCALE] || '',
      idVuelo: extras[CONFIG.FILTER_FIELDS.FLIGHT_ID] || '',
      numFotogramas: extras[CONFIG.FILTER_FIELDS.NUM_FRAMES] || '0'
    };
  }

  buildFilterOptions() {
    this.filterOptions = { tipoVuelo: new Set(), tipologia: new Set(), color: new Set(), years: { min: Infinity, max: -Infinity } };
    this.flights.forEach((flight) => {
      if (flight.tipoVuelo) this.filterOptions.tipoVuelo.add(flight.tipoVuelo);
      if (flight.tipologia) this.filterOptions.tipologia.add(flight.tipologia);
      if (flight.color) this.filterOptions.color.add(flight.color);
      if (flight.year) {
        const year = parseInt(flight.year, 10);
        if (!isNaN(year)) {
          this.filterOptions.years.min = Math.min(this.filterOptions.years.min, year);
          this.filterOptions.years.max = Math.max(this.filterOptions.years.max, year);
        }
      }
    });
  }

  applyFilters(filters) {
    this.filteredFlights = this.flights.filter((flight) => {
      if (filters.textSearch) {
        const searchTerm = this.normalizeText(filters.textSearch);
        const titleMatch = this.normalizeText(flight.title).includes(searchTerm);
        const descMatch = this.normalizeText(flight.description).includes(searchTerm);
        const extrasMatch = Object.values(flight.extras).some((v) => this.normalizeText(v).includes(searchTerm));
        if (!titleMatch && !descMatch && !extrasMatch) return false;
      }
      if (filters.tipoVuelo && flight.tipoVuelo !== filters.tipoVuelo) return false;
      if (filters.tipologia && flight.tipologia !== filters.tipologia) return false;
      if (filters.color && flight.color !== filters.color) return false;
      if (filters.yearFrom || filters.yearTo) {
        const year = parseInt(flight.year, 10);
        if (isNaN(year)) return false;
        if (filters.yearFrom && year < parseInt(filters.yearFrom, 10)) return false;
        if (filters.yearTo && year > parseInt(filters.yearTo, 10)) return false;
      }
      return true;
    });
    return this.filteredFlights;
  }

  getFilteredFlights() { return this.filteredFlights; }
  getAllFlights() { return this.flights; }
  getFilterOptions() {
    return {
      tipoVuelo: Array.from(this.filterOptions.tipoVuelo).sort(),
      tipologia: Array.from(this.filterOptions.tipologia).sort(),
      color: Array.from(this.filterOptions.color).sort(),
      yearMin: this.filterOptions.years.min !== Infinity ? this.filterOptions.years.min : null,
      yearMax: this.filterOptions.years.max !== -Infinity ? this.filterOptions.years.max : null
    };
  }
  getFlightByName(name) { return this.flights.find((f) => f.name === name); }

  async fetchPackageById(fotogramaId) {
    const ckanId = fotogramaId.replace(/-/, '_').toLowerCase();
    const url = `${CONFIG.CKAN.API_URL}/package_show?id=${ckanId}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message || 'CKAN API error');
    return {
      id: data.result.id,
      name: data.result.name,
      downloadUrl: data.result.resources.find((r) => r.mimetype === 'JPEG20000' || (r.mimetype && r.mimetype.includes('jp2')))?.url ?? null,
      resources: data.result.resources,
      extras: data.result.extras
    };
  }
}
