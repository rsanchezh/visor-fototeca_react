import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MAPEAController } from '../lib/mapeaController';

export function MapContainer() {
  const mapRef = useRef(null);
  const [containerReady, setContainerReady] = useState(false);
  const initDoneRef = useRef(false);
  const {
    getCkanService,
    setMapeaController,
    getActiveLayersRef,
    getMapeaController,
    showLoading,
    hideLoading,
    showError,
    loading,
    loadingMessage,
    error,
  } = useApp();

  useEffect(() => {
    if (!containerReady || !mapRef.current || typeof window.M === 'undefined' || initDoneRef.current) return;

    const ckan = getCkanService();
    const activeRef = getActiveLayersRef();

    try {
      const controller = new MAPEAController({
        ckanService: ckan,
        onLayersChange: () => activeRef.updateLayersList?.(),
        getIsRemoveMode: () => activeRef.isRemoveMode ?? false,
      });

      const ok = controller.initialize();
      if (ok) {
        controller.onFeatureClick(async (properties) => {
          const success = await controller.loadPhotoWMS(properties);
          if (success) activeRef.updateLayersList?.();
        });
        setMapeaController(controller);
        initDoneRef.current = true;
      }
    } catch (err) {
      console.error('Error inicializando mapa:', err);
    }
  }, [containerReady, getCkanService, getActiveLayersRef, setMapeaController]);

  return (
    <main className="map-container">
      <div
        id="mapjs"
        className="mapea-map"
        ref={(el) => {
          mapRef.current = el;
          if (el) setContainerReady(true);
        }}
      />
      <div className={`loading-overlay ${loading || error ? '' : 'hidden'}`} id="loadingOverlay">
        {error ? (
          <div style={{ textAlign: 'center', color: 'var(--text-primary)' }}>
            <p style={{ marginBottom: '0.5rem' }}>Error</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{error}</p>
            <button type="button" onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--primary-color)', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer' }}>
              Recargar página
            </button>
          </div>
        ) : (
          <>
            <div className="loading-spinner" />
            <p className="loading-text">{loadingMessage}</p>
          </>
        )}
      </div>
    </main>
  );
}
