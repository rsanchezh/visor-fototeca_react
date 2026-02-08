import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveLayersPanel } from './ActiveLayersPanel';

const DEBOUNCE_MS = 500;

export function FilterPanel() {
  const {
    getCkanService,
    getMapeaController,
    getActiveLayersRef,
    filteredFlights,
    setFilteredFlights,
    selectedFlightName,
    setSelectedFlightName,
    showLoading,
    hideLoading,
    showError,
    sidebarCollapsed,
    filtersCollapsed,
    setFiltersCollapsed,
    toggleSidebar,
  } = useApp();

  const [filterOptions, setFilterOptions] = useState({ tipoVuelo: [], tipologia: [], color: [], yearMin: null, yearMax: null });
  const [filters, setFilters] = useState({ textSearch: '', tipoVuelo: '', tipologia: '', color: '', yearFrom: '', yearTo: '' });
  const searchTimeoutRef = useRef(null);
  const mainContainerRef = useRef(null);

  const ckan = getCkanService();

  useEffect(() => {
    const opts = ckan.getFilterOptions();
    setFilterOptions(opts);
  }, [filteredFlights.length, ckan]);

  const applyFilters = useCallback(() => {
    const filtered = ckan.applyFilters(filters);
    setFilteredFlights(filtered);
  }, [ckan, filters, setFilteredFlights]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(applyFilters, DEBOUNCE_MS);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [filters.textSearch]);

  const resetFilters = () => {
    setFilters({ textSearch: '', tipoVuelo: '', tipologia: '', color: '', yearFrom: '', yearTo: '' });
    setTimeout(applyFilters, 0);
  };

  const selectFlight = useCallback(async (flightName) => {
    setSelectedFlightName(flightName);
    const flight = ckan.getFlightByName(flightName);
    if (!flight) return;
    const controller = getMapeaController();
    if (!controller) return;
    showLoading(`Cargando vuelo: ${flight.title}...`);
    try {
      const success = await controller.loadFlightLayers(flight);
      if (!success) throw new Error('Error al cargar las capas del vuelo');
      setFiltersCollapsed(true);
    } catch (err) {
      showError('Error al cargar el vuelo: ' + err.message);
      return;
    }
    hideLoading();
  }, [ckan, getMapeaController, setSelectedFlightName, showLoading, hideLoading, showError, setFiltersCollapsed]);

  const onFilterChange = useCallback(() => {
    const controller = getMapeaController();
    const current = controller?.getCurrentFlight();
    if (current && !filteredFlights.find((f) => f.name === current.name)) {
      controller?.clearLayers();
    }
  }, [getMapeaController, filteredFlights]);

  useEffect(() => {
    onFilterChange();
  }, [filteredFlights]);

  const sortedFlights = (Array.isArray(filteredFlights) ? [...filteredFlights] : []).sort((a, b) =>
    (a.title || a.name || '').toLowerCase().localeCompare((b.title || b.name || '').toLowerCase(), 'es', { sensitivity: 'base' })
  );

  return (
    <>
      <aside className="filter-panel">
        <div className="filter-header">
          <h2 className="filter-title">Filtros</h2>
          <button type="button" className="collapse-toggle" id="sidebarCollapseBtn" title="Ocultar Panel Lateral" onClick={toggleSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div style={{ flex: 1 }} />
          <button type="button" className={`collapse-toggle ${filtersCollapsed ? 'collapsed' : ''}`} id="filtersToggle" title="Colapsar/Expandir Filtros" onClick={() => setFiltersCollapsed((v) => !v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <button type="button" className="filter-reset" id="resetFilters" title="Restablecer filtros" onClick={resetFilters}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" />
            </svg>
          </button>
        </div>

        <div id="filtersBody" className={`filters-body ${filtersCollapsed ? 'collapsed' : ''}`}>
          <div className="filter-group compact">
            <label htmlFor="filterTextSearch" className="filter-label-inline">Búsqueda:</label>
            <input
              type="text"
              id="filterTextSearch"
              className="filter-input-compact"
              placeholder="Buscar..."
              value={filters.textSearch}
              onChange={(e) => setFilters((f) => ({ ...f, textSearch: e.target.value }))}
            />
          </div>
          <div className="filter-group compact">
            <label htmlFor="filterTipoVuelo" className="filter-label-inline">Tipo:</label>
            <select id="filterTipoVuelo" className="filter-select-compact" value={filters.tipoVuelo} onChange={(e) => setFilters((f) => ({ ...f, tipoVuelo: e.target.value }))}>
              <option value="">Todos</option>
              {filterOptions.tipoVuelo.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="filter-group compact">
            <label htmlFor="filterTipologia" className="filter-label-inline">Tipología:</label>
            <select id="filterTipologia" className="filter-select-compact" value={filters.tipologia} onChange={(e) => setFilters((f) => ({ ...f, tipologia: e.target.value }))}>
              <option value="">Todas</option>
              {filterOptions.tipologia.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="filter-group compact">
            <label htmlFor="filterColor" className="filter-label-inline">Color:</label>
            <select id="filterColor" className="filter-select-compact" value={filters.color} onChange={(e) => setFilters((f) => ({ ...f, color: e.target.value }))}>
              <option value="">Todos</option>
              {filterOptions.color.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="filter-group compact">
            <label className="filter-label-inline">Año:</label>
            <div className="year-range-compact">
              <input
                type="number"
                id="filterYearFrom"
                className="filter-input-compact year-input"
                placeholder={filterOptions.yearMin ?? 'Desde'}
                min="1900"
                max="2100"
                value={filters.yearFrom || ''}
                onChange={(e) => setFilters((f) => ({ ...f, yearFrom: e.target.value }))}
              />
              <span className="year-separator">-</span>
              <input
                type="number"
                id="filterYearTo"
                className="filter-input-compact year-input"
                placeholder={filterOptions.yearMax ?? 'Hasta'}
                min="1900"
                max="2100"
                value={filters.yearTo || ''}
                onChange={(e) => setFilters((f) => ({ ...f, yearTo: e.target.value }))}
              />
            </div>
          </div>
          <button type="button" className="filter-apply" id="applyFilters" onClick={applyFilters}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            Aplicar Filtros
          </button>
          <div className="filter-results" id="filterResults">
            <span className="results-count" id="resultsCount">{(filteredFlights?.length ?? 0)} vuelo{(filteredFlights?.length ?? 0) !== 1 ? 's' : ''} encontrado{(filteredFlights?.length ?? 0) !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <ActiveLayersPanel />

        <div className="flight-list">
          <div className="flight-list-header" id="flightListHeader">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Vuelos Disponibles
            </h3>
          </div>
          <div className="flight-list-items" id="flightListItems">
            {sortedFlights.map((flight) => (
              <div
                key={flight.name}
                className={`flight-item ${selectedFlightName === flight.name ? 'active' : ''}`}
                data-flight-name={flight.name}
                role="button"
                tabIndex={0}
                onClick={() => selectFlight(flight.name)}
                onKeyDown={(e) => e.key === 'Enter' && selectFlight(flight.name)}
              >
                <div className="flight-item-title">{flight.title}</div>
                <div className="flight-item-meta">
                  {flight.year && <span className="flight-item-badge">{flight.year}</span>}
                  {flight.color && <span className="flight-item-badge">{flight.color}</span>}
                  {flight.escala && <span className="flight-item-badge">1:{flight.escala}</span>}
                  {flight.numFotogramas && <span className="flight-item-badge">{flight.numFotogramas} fotogramas</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <button
        type="button"
        id="sidebarExpandBtn"
        className={`sidebar-expand-btn ${sidebarCollapsed ? '' : 'hidden'}`}
        title="Mostrar Panel Lateral"
        onClick={toggleSidebar}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
      </button>
    </>
  );
}
