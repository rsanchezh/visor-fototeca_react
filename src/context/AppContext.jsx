import { createContext, useContext, useState, useRef, useCallback } from 'react';
import { CKANService } from '../services/ckanService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando...');
  const [error, setError] = useState(null);
  const [flights, setFlights] = useState([]);
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [selectedFlightName, setSelectedFlightName] = useState(null);
  const [activeLayersVersion, setActiveLayersVersion] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  const ckanServiceRef = useRef(new CKANService());
  const mapeaControllerRef = useRef(null);
  const activeLayersRef = useRef({ isRemoveMode: false, updateLayersList: () => setActiveLayersVersion((v) => v + 1) });

  const getCkanService = useCallback(() => ckanServiceRef.current, []);
  const getMapeaController = useCallback(() => mapeaControllerRef.current, []);
  const setMapeaController = useCallback((ctrl) => { mapeaControllerRef.current = ctrl; }, []);
  const getActiveLayersRef = useCallback(() => activeLayersRef.current, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((v) => !v);
    setTimeout(() => {
      const map = mapeaControllerRef.current?.getMap?.();
      if (map?.refresh) map.refresh();
      try {
        const olMap = map?.getMapImpl?.();
        if (olMap?.updateSize) olMap.updateSize();
      } catch (_) {}
    }, 400);
  }, []);

  const showLoading = useCallback((msg = 'Cargando...') => {
    setLoadingMessage(msg);
    setLoading(true);
    setError(null);
  }, []);
  const hideLoading = useCallback(() => setLoading(false), []);
  const showError = useCallback((msg) => {
    setError(msg);
    setLoading(false);
  }, []);

  const value = {
    loading,
    loadingMessage,
    error,
    flights,
    filteredFlights,
    setFilteredFlights,
    selectedFlightName,
    setSelectedFlightName,
    activeLayersVersion,
    sidebarCollapsed,
    setSidebarCollapsed,
    filtersCollapsed,
    setFiltersCollapsed,
    showLoading,
    hideLoading,
    showError,
    getCkanService,
    getMapeaController,
    setMapeaController,
    getActiveLayersRef,
    toggleSidebar,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
