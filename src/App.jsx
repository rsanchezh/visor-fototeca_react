import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { MapContainer } from './components/MapContainer';
import { PhotoViewerModal } from './components/PhotoViewerModal';

function AppContent() {
  const {
    showLoading,
    hideLoading,
    showError,
    getCkanService,
    setFilteredFlights,
    setSelectedFlightName,
  } = useApp();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      showLoading('Cargando datos de vuelos...');
      try {
        const ckan = getCkanService();
        await ckan.fetchFlights();
        if (cancelled) return;
        setFilteredFlights(ckan.getFilteredFlights());
        hideLoading();
      } catch (err) {
        if (!cancelled) showError('Error al cargar los datos: ' + err.message);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [getCkanService, showLoading, hideLoading, showError, setFilteredFlights]);

  const { sidebarCollapsed, toggleSidebar } = useApp();

  return (
    <>
      <Header />
      <div className={`main-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} id="main-container">
        <FilterPanel />
        <button
          type="button"
          id="sidebarExpandBtn"
          className={`sidebar-expand-btn ${sidebarCollapsed ? '' : 'hidden'}`}
          title="Mostrar Panel Lateral"
          onClick={toggleSidebar}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
        <MapContainer />
      </div>
      <PhotoViewerModal />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
